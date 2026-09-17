'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TourRoute } from '@/lib/types';
import { invalidarContenidoPublico } from '@/lib/revalidate';
import { requireRole, sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';
import { RutaSchema, OrdenSchema, detallesDeZod } from '@/lib/esquemas';

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
): Promise<Resultado<TourRoute>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  const validado = RutaSchema.safeParse(data ?? {});
  if (!validado.success) {
    return fallo(
      'VALIDACION',
      'Hay datos de la ruta que no podemos guardar. Revisa los campos marcados.',
      detallesDeZod(validado.error)
    );
  }
  const limpio = validado.data as Partial<TourRoute>;

  const slug =
    limpio.slug ||
    limpio.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'nueva-ruta';
  const id = limpio.id || slug;

  const result = await prisma.tourRoute.upsert({
    where: { id },
    update: {
      nombre: limpio.nombre,
      slug,
      descripcion: limpio.descripcion,
      color: limpio.color || '#E63946',
      poiIds: limpio.poiIds || [],
      duracionEstimada: limpio.duracionEstimada,
      distanciaKm: limpio.distanciaKm ? Number(limpio.distanciaKm) : null,
      dificultad: limpio.dificultad || 'Fácil',
      hitos: toJsonInput(limpio.hitos),
      consejos: toJsonInput(limpio.consejos),
      tiemposParada: toJsonInput(limpio.tiemposParada),
      mapaImagen: limpio.mapaImagen,
      destacada: limpio.destacada ?? false,
      activo: limpio.activo ?? true,
      orden: limpio.orden ?? 0,
    },
    create: {
      id,
      slug,
      nombre: limpio.nombre || 'Nueva Ruta',
      descripcion: limpio.descripcion || '',
      color: limpio.color || '#E63946',
      poiIds: limpio.poiIds || [],
      duracionEstimada: limpio.duracionEstimada,
      distanciaKm: limpio.distanciaKm ? Number(limpio.distanciaKm) : null,
      dificultad: limpio.dificultad || 'Fácil',
      hitos: toJsonInput(limpio.hitos) ?? [],
      consejos: toJsonInput(limpio.consejos) ?? [],
      tiemposParada: toJsonInput(limpio.tiemposParada) ?? {},
      mapaImagen: limpio.mapaImagen,
      destacada: limpio.destacada ?? false,
      activo: limpio.activo ?? true,
      orden: limpio.orden ?? 0,
    },
  });

  invalidarContenidoPublico();
  return exito(result as unknown as TourRoute);
}

export async function deleteTourRoute(id: string): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  try {
    await prisma.tourRoute.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return fallo('NO_ENCONTRADO', 'Esa ruta ya no existe: alguien la eliminó antes.');
    }
    throw error;
  }

  invalidarContenidoPublico();
  return exito(true);
}

export async function updateTourRouteStops(
  routeId: string,
  poiIds: string[]
): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  const validado = OrdenSchema.safeParse(poiIds);
  if (!validado.success) {
    return fallo('VALIDACION', 'La lista de paradas que llegó no es válida.');
  }

  try {
    await prisma.tourRoute.update({
      where: { id: routeId },
      data: { poiIds: validado.data },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return fallo('NO_ENCONTRADO', 'Esa ruta ya no existe. Recarga la página.');
    }
    throw error;
  }

  invalidarContenidoPublico();
  return exito(true);
}
