'use server';

/**
 * Server action de las métricas de visitas del sitio público.
 *
 * Autorización: basta una sesión válida, de cualquier rol. Un LECTOR ya puede
 * ver las estadísticas del panel, y estas son datos agregados y anónimos, sin
 * ninguna capacidad de edición asociada.
 */

import { getVisitStats, getVisitasDetalle } from '@/lib/analytics';
import type { VisitStats, VisitRangoPreset, VisitasDetalle } from '@/lib/types';
import { sesionConRol } from './authActions';
import { Resultado, exito } from '@/lib/resultado';

/** Cualquier rol con sesión puede ver las métricas: son datos agregados y anónimos. */
const ROLES = ['ADMIN', 'EDITOR', 'LECTOR'] as const;

export async function getVisitStatsAdmin(
  preset: VisitRangoPreset = '30d',
  desde?: string,
  hasta?: string
): Promise<Resultado<VisitStats>> {
  const sesion = await sesionConRol([...ROLES]);
  if (!sesion.ok) return sesion;
  return exito(await getVisitStats(preset, desde, hasta));
}

export async function getVisitasDetalleAdmin(
  preset: VisitRangoPreset = '30d',
  desde?: string,
  hasta?: string,
  pagina: number = 1
): Promise<Resultado<VisitasDetalle>> {
  const sesion = await sesionConRol([...ROLES]);
  if (!sesion.ok) return sesion;
  return exito(await getVisitasDetalle(preset, desde, hasta, pagina));
}
