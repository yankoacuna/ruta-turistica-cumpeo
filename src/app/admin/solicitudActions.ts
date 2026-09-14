'use server';

/**
 * Server actions de la bandeja de solicitudes del CMS.
 *
 * Autorización: leer exige sesión de cualquier rol (un LECTOR puede revisar lo
 * que llega, igual que ve el resto del contenido); cambiar el estado exige
 * ADMIN o EDITOR; borrar, solo ADMIN, porque es lo único irreversible.
 */

import { prisma } from '@/lib/prisma';
import { SolicitudRecord, SolicitudEstado, SolicitudTipo, Coordinates, Horario } from '@/lib/types';
import { getAdminSession, requireRole } from './actions';

const ESTADOS_VALIDOS: SolicitudEstado[] = [
  'NUEVA',
  'EN_REVISION',
  'APROBADA',
  'RECHAZADA',
  'PUBLICADA',
];

/** Fila de la base a la forma que usa el panel. */
function aRegistro(fila: Record<string, any>): SolicitudRecord {
  return {
    ...fila,
    tipo: fila.tipo as SolicitudTipo,
    estado: fila.estado as SolicitudEstado,
    coordenadas: (fila.coordenadas as Coordinates | null) ?? null,
    horario: (fila.horario as Horario | null) ?? null,
  } as SolicitudRecord;
}

/**
 * Todas las solicitudes, las más nuevas primero.
 *
 * Se traen completas y sin paginar a propósito: una comuna del tamaño de Río
 * Claro va a recibir decenas al año, no miles, y tenerlas en memoria permite
 * filtrar y buscar en el panel sin ida y vuelta al servidor.
 */
export async function getSolicitudes(): Promise<SolicitudRecord[]> {
  const session = await getAdminSession();
  if (!session) return [];

  const filas = await prisma.solicitud.findMany({ orderBy: { createdAt: 'desc' } });
  return filas.map(aRegistro);
}

/** Cuántas están sin revisar: alimenta el contador rojo de la barra lateral. */
export async function contarSolicitudesPendientes(): Promise<number> {
  const session = await getAdminSession();
  if (!session) return 0;

  return prisma.solicitud.count({ where: { estado: { in: ['NUEVA', 'EN_REVISION'] } } });
}

/**
 * Cambia el estado de una solicitud y deja registrado quién la revisó.
 * La nota interna es para el equipo municipal: el solicitante no la ve.
 */
export async function cambiarEstadoSolicitud(
  id: string,
  estado: SolicitudEstado,
  notaInterna?: string
): Promise<SolicitudRecord> {
  const session = await requireRole(['ADMIN', 'EDITOR']);

  if (!ESTADOS_VALIDOS.includes(estado)) {
    throw new Error('Estado no válido');
  }

  const actualizada = await prisma.solicitud.update({
    where: { id },
    data: {
      estado,
      notaInterna: notaInterna !== undefined ? notaInterna.trim().slice(0, 1000) || null : undefined,
      revisadoPorId: session.id,
      revisadoPorNombre: session.nombre,
      revisadoEn: new Date(),
    },
  });

  return aRegistro(actualizada);
}

/**
 * Marca la solicitud como publicada y la enlaza con la ficha creada.
 *
 * Se llama sola cuando el panel guarda una ficha que nació de una solicitud, y
 * es lo que evita que el mismo negocio se publique dos veces por olvido.
 */
export async function marcarSolicitudPublicada(
  id: string,
  fichaId: string,
  fichaTipo: string
): Promise<SolicitudRecord> {
  const session = await requireRole(['ADMIN', 'EDITOR']);

  const actualizada = await prisma.solicitud.update({
    where: { id },
    data: {
      estado: 'PUBLICADA',
      publicadoComoId: fichaId,
      publicadoComoTipo: fichaTipo,
      revisadoPorId: session.id,
      revisadoPorNombre: session.nombre,
      revisadoEn: new Date(),
    },
  });

  return aRegistro(actualizada);
}

/** Borra una solicitud. Solo ADMIN: es lo único que no tiene vuelta atrás. */
export async function eliminarSolicitud(id: string): Promise<boolean> {
  await requireRole(['ADMIN']);
  await prisma.solicitud.delete({ where: { id } });
  return true;
}
