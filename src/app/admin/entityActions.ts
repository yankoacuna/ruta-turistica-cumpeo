'use server';

import { prisma } from '@/lib/prisma';
import { Destination, Restaurant, Accommodation, CumpeoEvent, OrderableEntity } from '@/lib/types';
import { invalidarContenidoPublico } from '@/lib/revalidate';
import { CENTRO_CUMPEO } from '@/lib/constants';
import { assertAuthorized, requireRole } from './authActions';

/**
 * Próximo valor de `orden` para una ficha nueva: el mayor actual + 1.
 * Sin esto, una ficha nueva nace en 0 y salta al primer lugar de la portada,
 * por delante de todo lo que el municipio ya ordenó a mano.
 */
async function nextOrden(
  model: 'destination' | 'restaurant' | 'accommodation' | 'event'
): Promise<number> {
  const agg = await (prisma[model] as any).aggregate({ _max: { orden: true } });
  return (agg._max.orden ?? -1) + 1;
}

// ─── CRUD GENÉRICO PARA LOS TIPOS DE LUGAR ─────────────────────────────────
// Destino, Restaurante, Alojamiento y Evento comparten la misma mecánica de
// guardado (upsert por id derivado del nombre, orden automático al crear,
// revalidación de rutas) y de borrado. Lo único que cambia entre ellos es qué
// campos tienen y qué valor usan por defecto al crear uno nuevo — eso vive en
// ENTITY_CONFIGS. Agregar un tipo de lugar nuevo es agregar una entrada ahí,
// no duplicar el guardado/borrado completo.

function slugFromNombre(nombre?: string): string {
  return nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
}

/** Campo simple (se guarda tal cual llega) o con un valor de reemplazo cuando viene nulo/vacío. */
type FieldSpec = string | { key: string; coalesce: unknown };

interface EntityCrudConfig {
  model: 'destination' | 'restaurant' | 'accommodation' | 'event';
  fields: FieldSpec[];
  /** Solo se aplican al crear un registro nuevo, y solo si el campo llega vacío. */
  createDefaults: Record<string, unknown>;
  /** Solo Destination tiene columna `slug` propia; los demás derivan el id directo del nombre. */
  hasSlug: boolean;
  idFallback: string;
}

const ENTITY_CONFIGS: Record<string, EntityCrudConfig> = {
  destination: {
    model: 'destination',
    hasSlug: true,
    idFallback: 'new-dest',
    fields: [
      'nombre', 'categoria', 'descripcionCorta', 'descripcionLarga', 'historia',
      'coordenadas', 'direccion', 'horario', 'duracionVisita', 'comoLlegar', 'tags',
      'imagenPrincipal', { key: 'galeria', coalesce: [] }, 'rating', 'destacado',
      { key: 'activo', coalesce: true },
    ],
    createDefaults: {
      nombre: 'Nuevo Destino', categoria: 'cultural', descripcionCorta: '',
      coordenadas: CENTRO_CUMPEO, tags: [], destacado: false,
    },
  },
  restaurant: {
    model: 'restaurant',
    hasSlug: false,
    idFallback: 'new-rest',
    fields: [
      'nombre', 'tipo', 'descripcion', 'especialidad', 'propietario', 'coordenadas',
      'direccion', 'telefono', 'whatsapp', 'horario', { key: 'mediosPago', coalesce: [] },
      { key: 'tags', coalesce: [] }, 'imagenPrincipal', { key: 'galeria', coalesce: [] },
      'menuUrl', 'contacto', { key: 'activo', coalesce: true },
    ],
    createDefaults: { nombre: 'Nuevo Restaurante', descripcion: '', coordenadas: CENTRO_CUMPEO },
  },
  accommodation: {
    model: 'accommodation',
    hasSlug: false,
    idFallback: 'new-acc',
    fields: [
      'nombre', 'tipo', 'propietario', 'descripcion', 'coordenadas', 'direccion',
      'telefono', 'whatsapp', { key: 'servicios', coalesce: [] }, 'imagenPrincipal',
      { key: 'galeria', coalesce: [] }, 'contacto', { key: 'activo', coalesce: true },
    ],
    createDefaults: { nombre: 'Nuevo Alojamiento', descripcion: '', coordenadas: CENTRO_CUMPEO },
  },
  event: {
    model: 'event',
    hasSlug: false,
    idFallback: 'new-event',
    fields: [
      'nombre', 'tipo', 'descripcion', 'descripcionLarga', 'fecha',
      { key: 'recurrente', coalesce: true }, 'coordenadas', 'direccion', 'imagenPrincipal',
      { key: 'galeria', coalesce: [] }, { key: 'tags', coalesce: [] },
      { key: 'destacado', coalesce: false }, { key: 'activo', coalesce: true },
    ],
    // A diferencia de los otros 3 tipos, un evento nuevo sin coordenadas no
    // recibe una por defecto — así se comportaba antes de este refactor.
    createDefaults: { nombre: 'Nuevo Evento', tipo: 'ferias-libres', descripcion: '' },
  },
};

function buildFieldsData(data: Record<string, any>, fields: FieldSpec[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    if (typeof f === 'string') out[f] = data[f];
    else out[f.key] = data[f.key] ?? f.coalesce;
  }
  return out;
}

/**
 * Listado para el panel. A diferencia de las lecturas públicas incluye los
 * registros inactivos y sin publicar, así que exige sesión: los server actions
 * son endpoints HTTP públicos, y sin esta línea cualquiera podía invocarlos
 * desde fuera del panel y sacar el catastro completo —borradores, fichas
 * ocultas y datos de contacto de los dueños incluidos— sin iniciar sesión.
 * Un LECTOR puede listar; crear, editar y borrar siguen exigiendo más rol.
 */
async function genericGetAdminList(model: EntityCrudConfig['model']) {
  await requireRole(['ADMIN', 'EDITOR', 'LECTOR']);
  return (prisma[model] as any).findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
}

/**
 * Id libre para una ficha nueva.
 *
 * El id se deriva del nombre ("Plaza de Cumpeo" -> "plaza-de-cumpeo") y entraba
 * directo a un upsert: crear una ficha con el nombre de una que ya existía no
 * avisaba ni creaba una segunda, sino que sobrescribía la anterior en silencio,
 * con sus fotos, su historia y su galería. Es un accidente perfectamente
 * posible con dos locales homónimos ("Donde la Mary") o con dos personas
 * cargando el catastro a la vez.
 *
 * Ahora se busca el primer sufijo libre (plaza-de-cumpeo-2, -3...) y la ficha
 * existente queda intacta.
 */
async function idDisponible(
  config: EntityCrudConfig,
  base: string
): Promise<string> {
  const modelo = prisma[config.model] as any;
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

async function genericSaveEntity(config: EntityCrudConfig, data: Record<string, any>) {
  await assertAuthorized();

  const base = slugFromNombre(data.nombre) || config.idFallback;
  // Editar conserva el id; crear busca uno libre. El slug de una ficha ya
  // creada no se toca aunque le cambien el nombre: es su URL pública, y los
  // códigos QR impresos en la señalética apuntan a ella.
  const id = data.id || (await idDisponible(config, base));

  const fieldsData = buildFieldsData(data, config.fields);

  const createData: Record<string, any> = {
    id,
    ...(config.hasSlug ? { slug: id } : {}),
    ...fieldsData,
    orden: data.orden ?? (await nextOrden(config.model)),
  };
  for (const [key, fallback] of Object.entries(config.createDefaults)) {
    if (!createData[key]) createData[key] = fallback;
  }

  const result = await (prisma[config.model] as any).upsert({
    where: { id },
    update: fieldsData,
    create: createData,
  });

  invalidarContenidoPublico();
  return result;
}

async function genericDeleteEntity(model: EntityCrudConfig['model'], id: string) {
  await requireRole(['ADMIN']);
  await (prisma[model] as any).delete({ where: { id } });
  invalidarContenidoPublico();
  return true;
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

export async function saveDestination(data: Partial<Destination>) {
  return genericSaveEntity(ENTITY_CONFIGS.destination, data);
}

export async function deleteDestination(id: string) {
  return genericDeleteEntity('destination', id);
}

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────

/** Listado para el panel: incluye también los inactivos/ocultos (ver `getAdminDestinations`). */
export async function getAdminRestaurants(): Promise<Restaurant[]> {
  return genericGetAdminList('restaurant');
}

export async function saveRestaurant(data: Partial<Restaurant>) {
  return genericSaveEntity(ENTITY_CONFIGS.restaurant, data);
}

export async function deleteRestaurant(id: string) {
  return genericDeleteEntity('restaurant', id);
}

// ─── ACCOMMODATIONS ───────────────────────────────────────────────────────────

/** Listado para el panel: incluye también los inactivos/ocultos (ver `getAdminDestinations`). */
export async function getAdminAccommodations(): Promise<Accommodation[]> {
  return genericGetAdminList('accommodation');
}

export async function saveAccommodation(data: Partial<Accommodation>) {
  return genericSaveEntity(ENTITY_CONFIGS.accommodation, data);
}

export async function deleteAccommodation(id: string) {
  return genericDeleteEntity('accommodation', id);
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export async function getEvents() {
  return genericGetAdminList('event');
}

export async function saveEvent(data: Partial<CumpeoEvent>) {
  return genericSaveEntity(ENTITY_CONFIGS.event, data);
}

export async function deleteEvent(id: string) {
  return genericDeleteEntity('event', id);
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
): Promise<{ actualizados: number }> {
  await requireRole(['ADMIN', 'EDITOR']);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { actualizados: 0 };
  }

  // Ids repetidos dejarian dos registros con la misma posicion.
  const ids = Array.from(new Set(orderedIds.filter((id) => typeof id === 'string' && id)));

  const updates = ids.map((id, index) => {
    const data = { orden: index };
    switch (tipo) {
      case 'destinos':
        return prisma.destination.update({ where: { id }, data });
      case 'restaurantes':
        return prisma.restaurant.update({ where: { id }, data });
      case 'alojamientos':
        return prisma.accommodation.update({ where: { id }, data });
      case 'eventos':
        return prisma.event.update({ where: { id }, data });
      default:
        throw new Error(`Catastro desconocido: ${tipo}`);
    }
  });

  await prisma.$transaction(updates);

  invalidarContenidoPublico();
  return { actualizados: ids.length };
}
