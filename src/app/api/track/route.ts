import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seccionDesdePath } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const MAX_PATH = 300;
const MAX_TITULO = 200;
const MAX_REFERRER = 120;
const MAX_ID = 80;

// Ventana y tope de eventos por dispositivo, para que un script no pueda
// inflar las métricas ni llenar la tabla a punta de peticiones.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_EVENTS = 40;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function superaLimite(visitorId: string): boolean {
  const ahora = Date.now();

  // Limpieza oportunista: sin esto el Map crece sin fin en un server largo.
  if (rateBuckets.size > 5000) {
    for (const [key, bucket] of rateBuckets) {
      if (bucket.resetAt <= ahora) rateBuckets.delete(key);
    }
  }

  const bucket = rateBuckets.get(visitorId);
  if (!bucket || bucket.resetAt <= ahora) {
    rateBuckets.set(visitorId, { count: 1, resetAt: ahora + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX_EVENTS;
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: true, ignored: 'payload' });
    }

    const path = recortar((body as any).path, MAX_PATH);
    const visitorId = recortar((body as any).visitorId, MAX_ID);
    const sessionId = recortar((body as any).sessionId, MAX_ID);

    // El panel nunca debe contarse a sí mismo.
    if (!path || !path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true, ignored: 'path' });
    }
    if (!visitorId || !sessionId) {
      return NextResponse.json({ ok: true, ignored: 'sin-id' });
    }
    if (superaLimite(visitorId)) {
      return NextResponse.json({ ok: true, ignored: 'rate-limit' });
    }

    await prisma.pageView.create({
      data: {
        path,
        titulo: recortar((body as any).titulo, MAX_TITULO),
        seccion: seccionDesdePath(path),
        visitorId,
        sessionId,
        referrer: normalizarReferrer(recortar((body as any).referrer, 500), req.headers.get('host')),
        device: detectarDispositivo(userAgent),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error registrando visita:', error);
    return NextResponse.json({ ok: false });
  }
}
