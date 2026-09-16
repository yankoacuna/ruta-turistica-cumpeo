'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TourRoute } from '@/lib/types';
import { invalidarContenidoPublico } from '@/lib/revalidate';
import { assertAuthorized, requireRole } from './authActions';

/**
 * Único punto donde un campo JSON tipado de la app (RouteMilestone[],
 * RouteTip[], Record<string, number>) cruza hacia el `Json` de Prisma. La
 * estructura ya se valida en la interfaz `TourRoute`; acá solo se declara
 * ese cruce una vez, en vez de esparcir `as any` en cada campo.
 */
function toJsonInput<T>(value: T | null | undefined): Prisma.InputJsonValue | undefined {
  return value === null || value === undefined ? undefined : (value as unknown as Prisma.InputJsonValue);
}

/** Listado para el panel: incluye rutas inactivas, así que exige sesión. */
export async function getAdminTourRoutes(): Promise<TourRoute[]> {
  await requireRole(['ADMIN', 'EDITOR', 'LECTOR']);
  try {
    const data = await prisma.tourRoute.findMany({
      orderBy: { orden: 'asc' },
    });
    return data as unknown as TourRoute[];
  } catch (error) {
    console.error('Error fetching admin tour routes:', error);
    return [];
  }
}

export async function saveTourRoute(
  data: Partial<TourRoute>
) {
  await assertAuthorized();
  const slug =
    data.slug ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'nueva-ruta';
  const id = data.id || slug;

  const result = await prisma.tourRoute.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      slug,
      descripcion: data.descripcion,
      color: data.color || '#E63946',
      poiIds: data.poiIds || [],
      duracionEstimada: data.duracionEstimada,
      distanciaKm: data.distanciaKm ? Number(data.distanciaKm) : null,
      dificultad: data.dificultad || 'Fácil',
      hitos: toJsonInput(data.hitos),
      consejos: toJsonInput(data.consejos),
      tiemposParada: toJsonInput(data.tiemposParada),
      mapaImagen: data.mapaImagen,
      destacada: data.destacada ?? false,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    },
    create: {
      id,
      slug,
      nombre: data.nombre || 'Nueva Ruta',
      descripcion: data.descripcion || '',
      color: data.color || '#E63946',
      poiIds: data.poiIds || [],
      duracionEstimada: data.duracionEstimada,
      distanciaKm: data.distanciaKm ? Number(data.distanciaKm) : null,
      dificultad: data.dificultad || 'Fácil',
      hitos: toJsonInput(data.hitos) ?? [],
      consejos: toJsonInput(data.consejos) ?? [],
      tiemposParada: toJsonInput(data.tiemposParada) ?? {},
      mapaImagen: data.mapaImagen,
      destacada: data.destacada ?? false,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    },
  });

  invalidarContenidoPublico();
  return result;
}

export async function deleteTourRoute(id: string) {
  await requireRole(['ADMIN']);
  await prisma.tourRoute.delete({ where: { id } });
  invalidarContenidoPublico();
  return true;
}

export async function updateTourRouteStops(routeId: string, poiIds: string[]) {
  await assertAuthorized();
  await prisma.tourRoute.update({
    where: { id: routeId },
    data: { poiIds },
  });
  invalidarContenidoPublico();
}
