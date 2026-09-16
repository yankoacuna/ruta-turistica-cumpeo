'use server';

/**
 * Server actions de la bandeja de solicitudes del CMS.
 *
 * Autorización: ver el listado (con nombre, correo y teléfono de cada
 * emprendedor) exige ADMIN o EDITOR — un LECTOR no necesita el contacto
 * personal de nadie para revisar el resto del contenido. El conteo de
 * pendientes sí queda abierto a los tres roles: es solo un número para el
 * indicador del panel, no expone datos de nadie. Cambiar el estado exige
 * ADMIN o EDITOR; borrar, solo ADMIN, porque es lo único irreversible.
 */

import { prisma } from '@/lib/prisma';
import { SolicitudRecord, SolicitudEstado, SolicitudTipo, Coordinates, Horario } from '@/lib/types';
import { sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';

const ESTADOS_VALIDOS: SolicitudEstado[] = [
  'NUEVA',
  'EN_REVISION',
  'APROBADA',
  'RECHAZADA',
  'PUBLICADA',
];

/** Cualquier rol con sesión puede ver el conteo (no expone datos personales). */
const ROLES_CONTEO = ['ADMIN', 'EDITOR', 'LECTOR'] as const;
const ROLES_GESTION = ['ADMIN', 'EDITOR'] as const;

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
export async function getSolicitudes(): Promise<Resultado<SolicitudRecord[]>> {
  const sesion = await sesionConRol([...ROLES_GESTION]);
  if (!sesion.ok) return sesion;

  const filas = await prisma.solicitud.findMany({ orderBy: { createdAt: 'desc' } });
  return exito(filas.map(aRegistro));
}

/** Cuántas están sin revisar: alimenta el contador rojo de la barra lateral. */
export async function contarSolicitudesPendientes(): Promise<Resultado<number>> {
  const sesion = await sesionConRol([...ROLES_CONTEO]);
  if (!sesion.ok) return sesion;

  const total = await prisma.solicitud.count({
    where: { estado: { in: ['NUEVA', 'EN_REVISION'] } },
  });
  return exito(total);
}

/**
 * Cambia el estado de una solicitud y deja registrado quién la revisó.
 * La nota interna es para el equipo municipal: el solicitante no la ve.
 */
export async function cambiarEstadoSolicitud(
  id: string,
  estado: SolicitudEstado,
  notaInterna?: string
): Promise<Resultado<SolicitudRecord>> {
  const sesion = await sesionConRol([...ROLES_GESTION]);
  if (!sesion.ok) return sesion;

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return fallo('VALIDACION', 'Ese estado no existe.', { estado: 'Estado no válido' });
  }

  try {
    const actualizada = await prisma.solicitud.update({
      where: { id },
      data: {
        estado,
        notaInterna:
          notaInterna !== undefined ? notaInterna.trim().slice(0, 1000) || null : undefined,
        revisadoPorId: sesion.data.id,
        revisadoPorNombre: sesion.data.nombre,
        revisadoEn: new Date(),
      },
    });
    return exito(aRegistro(actualizada));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return fallo('NO_ENCONTRADO', 'Esa solicitud ya no existe.');
    }
    throw error;
  }
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
): Promise<Resultado<SolicitudRecord>> {
  const sesion = await sesionConRol([...ROLES_GESTION]);
  if (!sesion.ok) return sesion;

  try {
    const actualizada = await prisma.solicitud.update({
      where: { id },
      data: {
        estado: 'PUBLICADA',
        publicadoComoId: fichaId,
        publicadoComoTipo: fichaTipo,
        revisadoPorId: sesion.data.id,
        revisadoPorNombre: sesion.data.nombre,
        revisadoEn: new Date(),
      },
    });
    return exito(aRegistro(actualizada));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return fallo('NO_ENCONTRADO', 'Esa solicitud ya no existe.');
    }
    throw error;
  }
}

/** Borra una solicitud. Solo ADMIN: es lo único que no tiene vuelta atrás. */
export async function eliminarSolicitud(id: string): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  try {
    await prisma.solicitud.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return fallo('NO_ENCONTRADO', 'Esa solicitud ya no existe.');
    }
    throw error;
  }
  return exito(true);
}
