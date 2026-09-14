'use server';

/**
 * Server action de las métricas de visitas del sitio público.
 *
 * Autorización: basta una sesión válida, de cualquier rol. Un LECTOR ya puede
 * ver las estadísticas del panel, y estas son datos agregados y anónimos, sin
 * ninguna capacidad de edición asociada.
 */

import { getVisitStats } from '@/lib/analytics';
import type { VisitStats, VisitRangoPreset } from '@/lib/types';
import { getAdminSession } from './actions';

export async function getVisitStatsAdmin(
  preset: VisitRangoPreset = '30d',
  desde?: string,
  hasta?: string
): Promise<VisitStats | null> {
  const session = await getAdminSession();
  if (!session) return null;
  return getVisitStats(preset, desde, hasta);
}
