import { NextRequest, NextResponse } from 'next/server';
import geoip from 'geoip-lite';
import { prisma } from '@/lib/prisma';
import { seccionDesdePath } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const MAX_PATH = 300;
const MAX_TITULO = 200;
const MAX_REFERRER = 120;
const MAX_ID = 80;
const MAX_PAIS = 2;
const MAX_REGION = 10;
const MAX_CIUDAD = 100;

// Ventana y tope de eventos por dispositivo, para que un script no pueda
// inflar las métricas ni llenar la tabla a punta de peticiones.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_EVENTS = 40;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

// Tope adicional por IP. El de arriba se cuenta por visitorId, un valor que
// genera el cliente y puede renovar en cada petición; este cuenta por IP, que
// no elige, y es más alto para no castigar a una oficina o una familia que
// navegan tras la misma conexión.
const RATE_MAX_EVENTS_IP = 200;
const rateBucketsIp = new Map<string, { count: number; resetAt: number }>();

function superaLimiteEn(
  mapa: Map<string, { count: number; resetAt: number }>,
  clave: string,
  max: number,
  maxEntradas: number
): boolean {
  const ahora = Date.now();

  // Limpieza oportunista: sin esto el Map crece sin fin en un server largo.
  if (mapa.size > maxEntradas) {
    for (const [key, bucket] of mapa) {
      if (bucket.resetAt <= ahora) mapa.delete(key);
    }
  }

  const bucket = mapa.get(clave);
  if (!bucket || bucket.resetAt <= ahora) {
    mapa.set(clave, { count: 1, resetAt: ahora + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

function superaLimite(visitorId: string): boolean {
  return superaLimiteEn(rateBuckets, visitorId, RATE_MAX_EVENTS, 5000);
}

function superaLimiteIp(ip: string): boolean {
  return superaLimiteEn(rateBucketsIp, ip, RATE_MAX_EVENTS_IP, 5000);
}

const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|uptime/i;

function detectarDispositivo(ua: string): string {
  if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|windows phone/i.test(ua)) return 'movil';
  return 'escritorio';
}

/**
 * Solo el dominio de origen: un referrer completo puede traer querystrings con
 * datos ajenos, y para el panel basta saber de dónde llegó el turista.
 */
function normalizarReferrer(referrer: string | null, host: string | null): string | null {
  if (!referrer) return null;
  try {
    const { hostname } = new URL(referrer);
    if (!hostname) return null;
    // Navegación dentro del propio sitio: no es una fuente de tráfico.
    if (host && hostname === host.split(':')[0]) return null;
    return hostname.slice(0, MAX_REFERRER);
  } catch {
    return null;
  }
}

function recortar(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, max) : null;
}

/**
 * IP real del visitante, tal como llega a esta app detrás del proxy del
 * hosting (cPanel/Passenger). Mismo criterio que ya usa el freno de fuerza
 * bruta del login (`authActions.ts`): x-forwarded-for antes que x-real-ip.
 * Esta IP solo se usa para el lookup de `leerGeo` más abajo; nunca se guarda.
 */
function ipDelPedido(req: NextRequest): string | null {
  const reenviada = req.headers.get('x-forwarded-for');
  if (reenviada) return reenviada.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/**
 * País/región/ciudad resueltos contra la base de datos local de `geoip-lite`
 * (bundle offline, sin llamadas de red ni servicios de terceros: coherente
 * con que este hosting es autocontenido, ver documento técnico). La IP se usa
 * solo en memoria para este lookup y se descarta de inmediato: no se guarda
 * en ningún lado ni viaja fuera de este proceso.
 */
function leerGeo(req: NextRequest): { pais: string | null; region: string | null; ciudad: string | null } {
  const ip = ipDelPedido(req);
  const datos = ip ? geoip.lookup(ip) : null;
  if (!datos) return { pais: null, region: null, ciudad: null };
  return {
    pais: recortar(datos.country, MAX_PAIS),
    region: recortar(datos.region, MAX_REGION),
    ciudad: recortar(datos.city, MAX_CIUDAD),
  };
}

/**
 * Registra una visita anónima del sitio público.
 * Siempre responde 200: es una métrica, y un fallo aquí no debe verse nunca en
 * la consola del turista ni afectar la navegación.
 */
export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    if (!userAgent || BOT_PATTERN.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: 'bot' });
    }

    const bodyCrudo = await req.json().catch(() => null);
    if (!bodyCrudo || typeof bodyCrudo !== 'object') {
      return NextResponse.json({ ok: true, ignored: 'payload' });
    }
    const body = bodyCrudo as Record<string, unknown>;

    const path = recortar(body.path, MAX_PATH);
    const visitorId = recortar(body.visitorId, MAX_ID);
    const sessionId = recortar(body.sessionId, MAX_ID);

    // El panel nunca debe contarse a sí mismo.
    if (!path || !path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true, ignored: 'path' });
    }
    if (!visitorId || !sessionId) {
      return NextResponse.json({ ok: true, ignored: 'sin-id' });
    }
    if (superaLimite(visitorId) || superaLimiteIp(ipDelPedido(req) || 'desconocida')) {
      return NextResponse.json({ ok: true, ignored: 'rate-limit' });
    }

    const geo = leerGeo(req);

    await prisma.pageView.create({
      data: {
        path,
        titulo: recortar(body.titulo, MAX_TITULO),
        seccion: seccionDesdePath(path),
        visitorId,
        sessionId,
        referrer: normalizarReferrer(recortar(body.referrer, 500), req.headers.get('host')),
        device: detectarDispositivo(userAgent),
        pais: geo.pais,
        region: geo.region,
        ciudad: geo.ciudad,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error registrando visita:', error);
    return NextResponse.json({ ok: false });
  }
}
