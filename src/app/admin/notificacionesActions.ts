'use server';

/**
 * Server actions de los destinatarios del aviso por correo de Solicitudes
 * nuevas (contacto y postulaciones de /sumate).
 *
 * Autorización: solo ADMIN, igual que Usuarios y Accesos, porque define
 * quién se entera de los datos personales que llegan del sitio público.
 */

import { prisma } from '@/lib/prisma';
import type { NotificacionesConfigRecord } from '@/lib/types';
import { sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';

const MAX_EMAILS = 10;

function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

function toRecord(row: {
  emails: unknown;
  updatedAt: Date;
  updatedByEmail: string | null;
  updatedByNombre: string | null;
}): NotificacionesConfigRecord {
  return {
    emails: Array.isArray(row.emails) ? (row.emails as string[]) : [],
    updatedAt: row.updatedAt.toISOString(),
    updatedByEmail: row.updatedByEmail,
    updatedByNombre: row.updatedByNombre,
  };
}

/** Destinatarios guardados, para precargar el formulario del CMS. */
export async function getNotificacionesAdmin(): Promise<Resultado<NotificacionesConfigRecord | null>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  try {
    const row = await prisma.notificacionesConfig.findUnique({ where: { id: 'default' } });
    return exito(row ? toRecord(row) : null);
  } catch (error) {
    console.warn('Error fetching notificaciones config:', error);
    return exito(null);
  }
}

/** Guarda la lista completa de destinatarios (reemplaza la anterior). */
export async function saveNotificaciones(
  emailsCrudos: string[]
): Promise<Resultado<NotificacionesConfigRecord>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  if (!Array.isArray(emailsCrudos)) {
    return fallo('VALIDACION', 'No recibimos la lista de destinatarios.');
  }

  const emails = Array.from(
    new Set(emailsCrudos.map((e) => String(e).trim().toLowerCase()).filter(Boolean))
  );

  if (emails.length > MAX_EMAILS) {
    return fallo('VALIDACION', `No puedes guardar más de ${MAX_EMAILS} destinatarios.`);
  }
  const invalido = emails.find((e) => !emailValido(e));
  if (invalido) {
    return fallo('VALIDACION', `"${invalido}" no es un correo válido.`, { emails: invalido });
  }

  const data = {
    emails,
    updatedByEmail: sesion.data.email,
    updatedByNombre: sesion.data.nombre,
  };

  const saved = await prisma.notificacionesConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  });

  return exito(toRecord(saved));
}
