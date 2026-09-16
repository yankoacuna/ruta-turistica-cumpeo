import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizarSolicitud } from '@/lib/solicitudes';
import { avisarSolicitud } from '@/lib/notificarSolicitud';

export const dynamic = 'force-dynamic';

// Un emprendedor postula una vez; un script lo intentaría cientos. El tope por
// IP y hora corta el abuso sin estorbarle a nadie real.
const VENTANA_MS = 60 * 60 * 1000;
const MAX_POR_VENTANA = 6;
const envios = new Map<string, { cuenta: number; expira: number }>();

function superaLimite(ip: string): boolean {
  const ahora = Date.now();

  if (envios.size > 2000) {
    for (const [clave, registro] of envios) {
      if (registro.expira <= ahora) envios.delete(clave);
    }
  }

  const registro = envios.get(ip);
  if (!registro || registro.expira <= ahora) {
    envios.set(ip, { cuenta: 1, expira: ahora + VENTANA_MS });
    return false;
  }
  registro.cuenta += 1;
  return registro.cuenta > MAX_POR_VENTANA;
}

/** IP del visitante detrás del proxy del hosting (cPanel/Passenger); en local no hay cabecera. */
function ipDe(req: NextRequest): string {
  const reenviada = req.headers.get('x-forwarded-for');
  if (reenviada) return reenviada.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'desconocida';
}

/**
 * URL del sitio para el enlace que va en el correo al municipio. Sale de una
 * variable de entorno y no de la cabecera Host, que la controla quien hace la
 * petición. Sin la variable, el correo va sin enlace.
 */
function urlDelSitio(_req: NextRequest): string | undefined {
  const configurada = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!configurada) return undefined;
  // Sin barra final, para no armar enlaces con doble barra.
  return configurada.replace(/[/]+$/, '');
}

/**
 * Recibe una solicitud del sitio público: la postulación de un emprendedor
 * (/sumate) o una consulta del formulario de contacto.
 *
 * El aviso por correo se manda después de guardar y sin esperar su resultado:
 * si el servicio de correo está caído, la solicitud igual queda registrada y
 * visible en el CMS, que es el registro que importa.
 */
export async function POST(req: NextRequest) {
  try {
    const cuerpo = await req.json().catch(() => null);

    // Campo trampa: está oculto en el formulario, así que solo lo rellenan los
    // robots. Se responde ok para no enseñarles que fueron detectados.
    if (cuerpo && typeof cuerpo === 'object' && (cuerpo as any).website) {
      return NextResponse.json({ ok: true, id: 'ignorada' });
    }

    if (superaLimite(ipDe(req))) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Recibimos varias solicitudes desde esta conexión. Intenta más tarde.',
        },
        { status: 429 }
      );
    }

    const { ok, data, errores } = normalizarSolicitud(cuerpo);
    if (!ok || !data) {
      return NextResponse.json({ ok: false, errores }, { status: 400 });
    }

    const creada = await prisma.solicitud.create({
      data: {
        tipo: data.tipo,
        solicitanteNombre: data.solicitanteNombre,
        solicitanteEmail: data.solicitanteEmail,
        solicitanteTelefono: data.solicitanteTelefono || null,
        solicitanteRol: data.solicitanteRol || null,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoriaSugerida: data.categoriaSugerida || null,
        especialidad: data.especialidad || null,
        direccion: data.direccion || null,
        // Se arman como objetos planos porque Prisma no acepta interfaces
        // declaradas en sus campos Json: espera una forma literal.
        coordenadas: data.coordenadas
          ? { lat: data.coordenadas.lat, lng: data.coordenadas.lng }
          : undefined,
        horario: data.horario
          ? {
              apertura: data.horario.apertura ?? '',
              cierre: data.horario.cierre ?? '',
              descripcion: data.horario.descripcion ?? '',
            }
          : undefined,
        telefono: data.telefono || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        web: data.web || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        servicios: data.servicios ?? [],
        mediosPago: data.mediosPago ?? [],
        fecha: data.fecha || null,
        fotos: data.fotos ?? [],
        mensaje: data.mensaje || null,
      },
      select: { id: true },
    });

    await avisarSolicitud(data, creada.id, urlDelSitio(req));

    return NextResponse.json({ ok: true, id: creada.id });
  } catch (error) {
    console.error('Error guardando solicitud:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'No pudimos registrar tu solicitud. Vuelve a intentarlo en unos minutos.',
      },
      { status: 500 }
    );
  }
}
