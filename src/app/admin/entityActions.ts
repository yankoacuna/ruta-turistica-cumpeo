'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Destination, Restaurant, Accommodation, CumpeoEvent, OrderableEntity } from '@/lib/types';
import { invalidarContenidoPublico } from '@/lib/revalidate';
import { requireRole, sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';
import { OrdenSchema, detallesDeZod } from '@/lib/esquemas';
import { ENTIDADES, DescriptorEntidad, buildFieldsData, slugFromNombre } from '@/lib/entidades';
import { modeloDe } from '@/lib/prismaModelo';

/**
 * Próximo valor de `orden` para una ficha nueva: el mayor actual + 1.
 * Sin esto, una ficha nueva nace en 0 y salta al primer lugar de la portada,
 * por delante de todo lo que el municipio ya ordenó a mano.
 */
async function nextOrden(model: DescriptorEntidad['modelo']): Promise<number> {
  const agg = await modeloDe(model).aggregate({ _max: { orden: true } });
  return (agg._max.orden ?? -1) + 1;
}

// ─── CRUD GENÉRICO PARA LOS TIPOS DE LUGAR ─────────────────────────────────
// Destino, Restaurante, Alojamiento y Evento comparten la misma mecánica de
// guardado (upsert por id derivado del nombre, orden automático al crear,
// revalidación de rutas) y de borrado. Lo único que cambia entre ellos es la
// forma de cada uno, descrita en `@/lib/entidades`. Agregar un tipo de lugar
// nuevo es agregar una entrada ahí, no duplicar el guardado/borrado completo.

/**
 * Listado para el panel. Incluye los registros inactivos y sin publicar, así
 * que exige sesión: un LECTOR puede listar, mientras que crear, editar y borrar
 * exigen más rol.
 */
async function genericGetAdminList(model: DescriptorEntidad['modelo']) {
  await requireRole(['ADMIN', 'EDITOR', 'LECTOR']);
  return modeloDe(model).findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
}

/**
 * Primer id libre derivado del nombre: "Plaza de Cumpeo" -> "plaza-de-cumpeo",
 * y si ya está tomado, "plaza-de-cumpeo-2", "-3"... Dos fichas con el mismo
 * nombre reciben ids distintos en vez de compartir uno.
 */
async function idDisponible(
  config: DescriptorEntidad,
  base: string
): Promise<string> {
  const modelo = modeloDe(config.modelo);
  for (let intento = 1; intento <= 50; intento++) {
    const candidato = intento === 1 ? base : `${base}-${intento}`;
    const ocupado = await modelo.findFirst({
      // El slug tiene su propio índice único: un id libre con el slug tomado
      // haría fallar el insert igual.
      where: config.hasSlug ? { OR: [{ id: candidato }, { slug: candidato }] } : { id: candidato },
      select: { id: true },
    });
    if (!ocupado) return candidato;
  }
  return `${base}-${Date.now()}`;
}

async function genericSaveEntity<T>(
  config: DescriptorEntidad,
  data: unknown
): Promise<Resultado<T>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  const validado = config.esquema.safeParse(data ?? {});
  if (!validado.success) {
    return fallo(
      'VALIDACION',
      'Hay datos que no podemos guardar. Revisa los campos marcados.',
      detallesDeZod(validado.error)
    );
  }
  const limpio = validado.data as Record<string, unknown> & {
    id?: string;
    nombre?: string;
    orden?: number;
  };

  const base = slugFromNombre(limpio.nombre) || config.idFallback;
  // Editar conserva el id; crear busca uno libre. El slug de una ficha ya
  // creada no se toca aunque le cambien el nombre: es su URL pública, y los
  // códigos QR impresos en la señalética apuntan a ella.
  const id = limpio.id || (await idDisponible(config, base));

  const fieldsData = buildFieldsData(limpio, config.campos);

  const createData: Record<string, unknown> = {
    id,
    ...(config.hasSlug ? { slug: id } : {}),
    ...fieldsData,
    orden: limpio.orden ?? (await nextOrden(config.modelo)),
  };
  for (const [key, fallback] of Object.entries(config.createDefaults)) {
    if (!createData[key]) createData[key] = fallback;
  }

  const result = await modeloDe(config.modelo).upsert({
    where: { id },
    update: fieldsData,
    create: createData,
  });

  invalidarContenidoPublico();
  return exito(result as T);
}

/** Código con que Prisma avisa que el registro del where no existe. */
const PRISMA_NO_ENCONTRADO = 'P2025';

async function genericDeleteEntity(
  config: DescriptorEntidad,
  id: string
): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  try {
    await modeloDe(config.modelo).delete({ where: { id } });
  } catch (error) {
    // Borrado concurrente desde dos pestañas: no es un error de sistema.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NO_ENCONTRADO) {
      return fallo('NO_ENCONTRADO', 'Esa ficha ya no existe: alguien la eliminó antes.');
    }
    throw error;
  }

  invalidarContenidoPublico();
  return exito(true);
}

// ─── DESTINATIONS ──────────────────────────────────────────────────────────

/**
 * Listado para el panel: a diferencia de `getDestinations` (usada por el sitio
 * público), incluye también los registros inactivos/ocultos, para que el
 * admin pueda encontrarlos, reactivarlos o eliminarlos.
 */
export async function getAdminDestinations(): Promise<Destination[]> {
  return genericGetAdminList('destination');
}

export async function saveDestination(data: Partial<Destination>): Promise<Resultado<Destination>> {
  return genericSaveEntity<Destination>(ENTIDADES.destination, data);
}

export async function deleteDestination(id: string): Promise<Resultado<true>> {
  return genericDeleteEntity(ENTIDADES.destination, id);
}

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────

/** Listado para el panel: incluye también los inactivos/ocultos (ver `getAdminDestinations`). */
export async function getAdminRestaurants(): Promise<Restaurant[]> {
  return genericGetAdminList('restaurant');
}

export async function saveRestaurant(data: Partial<Restaurant>): Promise<Resultado<Restaurant>> {
  return genericSaveEntity<Restaurant>(ENTIDADES.restaurant, data);
}

export async function deleteRestaurant(id: string): Promise<Resultado<true>> {
  return genericDeleteEntity(ENTIDADES.restaurant, id);
}

// ─── ACCOMMODATIONS ───────────────────────────────────────────────────────────

/** Listado para el panel: incluye también los inactivos/ocultos (ver `getAdminDestinations`). */
export async function getAdminAccommodations(): Promise<Accommodation[]> {
  return genericGetAdminList('accommodation');
}

export async function saveAccommodation(data: Partial<Accommodation>): Promise<Resultado<Accommodation>> {
  return genericSaveEntity<Accommodation>(ENTIDADES.accommodation, data);
}

export async function deleteAccommodation(id: string): Promise<Resultado<true>> {
  return genericDeleteEntity(ENTIDADES.accommodation, id);
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<CumpeoEvent[]> {
  return genericGetAdminList('event');
}

export async function saveEvent(data: Partial<CumpeoEvent>): Promise<Resultado<CumpeoEvent>> {
  return genericSaveEntity<CumpeoEvent>(ENTIDADES.event, data);
}

export async function deleteEvent(id: string): Promise<Resultado<true>> {
  return genericDeleteEntity(ENTIDADES.event, id);
}

// ─── ORDEN DE LOS CATASTROS EN LA PORTADA ─────────────────────────────────────

/**
 * Guarda el orden manual con que se muestran los catastros en la portada.
 *
 * Recibe los ids en el orden deseado y escribe la posicion (0, 1, 2...) en el
 * campo `orden` de cada registro. Las consultas publicas ordenan por
 * [orden asc, nombre asc], asi que un registro nuevo (orden 0) aparece arriba
 * y los empates siguen resolviendose alfabeticamente como antes.
 *
 * Se hace en una transaccion: o queda todo el orden nuevo, o no queda nada.
 * Un orden a medio aplicar seria peor que el anterior.
 */
export async function updateEntityOrder(
  tipo: OrderableEntity,
  orderedIds: string[]
): Promise<Resultado<{ actualizados: number }>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  const validado = OrdenSchema.safeParse(orderedIds);
  if (!validado.success) {
    return fallo('VALIDACION', 'La lista de orden que llegó no es válida.');
  }
  if (validado.data.length === 0) {
    return exito({ actualizados: 0 });
  }

  // Ids repetidos dejarian dos registros con la misma posicion.
  const ids = Array.from(new Set(validado.data.filter(Boolean)));

  const modelos: Record<OrderableEntity, DescriptorEntidad['modelo']> = {
    destinos: 'destination',
    restaurantes: 'restaurant',
    alojamientos: 'accommodation',
    eventos: 'event',
  };
  const modelo = modelos[tipo];
  if (!modelo) {
    return fallo('VALIDACION', `Catastro desconocido: ${tipo}`);
  }

  const updates = ids.map((id, index) =>
    modeloDe(modelo).update({ where: { id }, data: { orden: index } })
  );

  try {
    await prisma.$transaction(updates);
  } catch (error) {
    // Basta que alguien haya borrado una ficha mientras otro reordenaba.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NO_ENCONTRADO) {
      return fallo(
        'NO_ENCONTRADO',
        'Alguna de las fichas ya no existe. Recarga la página y vuelve a ordenar.'
      );
    }
    throw error;
  }

  invalidarContenidoPublico();
  return exito({ actualizados: ids.length });
}
