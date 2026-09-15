import { SolicitudInput } from '@/lib/types';
import { TIPO_LABEL } from '@/lib/solicitudes';
import { prisma } from '@/lib/prisma';

/**
 * Destinatarios configurados desde el CMS (Notificaciones); si esa tabla
 * está vacía, se usa SOLICITUDES_EMAIL_TO del .env como respaldo.
 */
async function destinatarios(): Promise<string[]> {
  try {
    const row = await prisma.notificacionesConfig.findUnique({ where: { id: 'default' } });
    if (Array.isArray(row?.emails) && row.emails.length) return row.emails as string[];
  } catch (error) {
    console.warn('No se pudo leer NotificacionesConfig, usando SOLICITUDES_EMAIL_TO:', error);
  }
  const respaldo = process.env.SOLICITUDES_EMAIL_TO;
  return respaldo ? respaldo.split(',').map((correo) => correo.trim()).filter(Boolean) : [];
}

/** Escapa el texto que entra al correo: lo escribió un desconocido. */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Avisa por correo al municipio que llegó una solicitud.
 *
 * Nunca lanza: el correo es un aviso, no el registro. Si faltan las
 * variables de SMTP o el envío falla, la solicitud ya quedó guardada y
 * visible en el CMS, que es lo que importa. Se manda por SMTP usando la
 * casilla de correo del propio hosting (cPanel), sin depender de un
 * servicio externo.
 */
export async function avisarSolicitud(
  solicitud: SolicitudInput,
  id: string,
  baseUrl?: string
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const usuario = process.env.SMTP_USER;
  const clave = process.env.SMTP_PASS;
  const remitente = process.env.SOLICITUDES_EMAIL_FROM || usuario;
  const puerto = Number(process.env.SMTP_PORT) || 465;
  const destino = await destinatarios();

  if (!host || !usuario || !clave || !remitente || destino.length === 0) {
    console.info(
      `Solicitud ${id} guardada. Aviso por correo desactivado: falta SMTP_HOST, SMTP_USER, SMTP_PASS, SOLICITUDES_EMAIL_FROM, o no hay destinatarios configurados (CMS → Notificaciones, o SOLICITUDES_EMAIL_TO).`
    );
    return;
  }

  const esConsulta = solicitud.tipo === 'CONSULTA';
  const asunto = esConsulta
    ? `Consulta desde el sitio: ${solicitud.nombre}`
    : `Nueva postulación (${TIPO_LABEL[solicitud.tipo]}): ${solicitud.nombre}`;

  const filas: Array<[string, string | undefined]> = [
    ['Tipo', TIPO_LABEL[solicitud.tipo]],
    [esConsulta ? 'Asunto' : 'Nombre del lugar', solicitud.nombre],
    ['Solicitante', solicitud.solicitanteNombre],
    ['Correo', solicitud.solicitanteEmail],
    ['Teléfono', solicitud.solicitanteTelefono],
    ['Relación con el lugar', solicitud.solicitanteRol],
    ['Dirección', solicitud.direccion],
    [esConsulta ? 'Mensaje' : 'Descripción', esConsulta ? solicitud.mensaje : solicitud.descripcion],
    ['Fotos adjuntas', solicitud.fotos?.length ? String(solicitud.fotos.length) : undefined],
  ];

  const cuerpo = `
    <div style="font-family:system-ui,sans-serif;font-size:14px;color:#231F20;line-height:1.5">
      <h2 style="margin:0 0 12px">${escapar(asunto)}</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        ${filas
          .filter(([, valor]) => valor)
          .map(
            ([etiqueta, valor]) =>
              `<tr><td style="color:#6B6055;vertical-align:top"><strong>${escapar(etiqueta)}</strong></td><td>${escapar(valor as string).replace(/\n/g, '<br>')}</td></tr>`
          )
          .join('')}
      </table>
      <p style="margin-top:16px;color:#6B6055">
        Revísala en el panel, sección <strong>Solicitudes</strong>${
          baseUrl ? `: <a href="${escapar(baseUrl)}/admin">${escapar(baseUrl)}/admin</a>` : ''
        }
      </p>
    </div>
  `;

  try {
    const nodemailer = await import('nodemailer');
    const transporte = nodemailer.createTransport({
      host,
      port: puerto,
      secure: puerto === 465, // 465 usa TLS implícito; 587 usa STARTTLS
      auth: { user: usuario, pass: clave },
    });

    await transporte.sendMail({
      from: remitente,
      to: destino,
      // Responder el correo escribe directo al emprendedor, sin copiar la dirección a mano.
      replyTo: solicitud.solicitanteEmail,
      subject: asunto,
      html: cuerpo,
    });
  } catch (error) {
    console.error(`No se pudo enviar el aviso de la solicitud ${id}:`, error);
  }
}
