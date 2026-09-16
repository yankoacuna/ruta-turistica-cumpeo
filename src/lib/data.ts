import { unstable_cache } from 'next/cache';
import { SITE_TEXT_DEFAULTS, SiteTexts, isKnownSiteTextKey } from './siteTexts';
import { Destination, Accommodation, Restaurant, AppConfig, POI, Coordinates, TourRoute, CumpeoEvent, EmergencyContact } from './types';
import { prisma } from './prisma';
import { resolveTheme, ResolvedTheme, ThemeOverrides } from './theme';

// ─── CACHÉ DEL CATASTRO PÚBLICO ───────────────────────────────────────────────

/**
 * Etiqueta de caché de todo el contenido del catastro: destinos, restaurantes,
 * alojamientos, eventos, rutas, contactos de emergencia y categorías.
 *
 * Las lecturas etiquetadas se resuelven una vez y se reusan entre visitas hasta
 * que una escritura del panel llama a `invalidarContenidoPublico()`
 * (src/lib/revalidate.ts).
 */
export const CONTENT_TAG = 'contenido-publico';

/**
 * Vida máxima de una entrada cacheada. La invalidación por etiqueta es lo que
 * manda; este tope acota cuánto puede quedar desactualizado el sitio si una
 * escritura no invalida.
 */
const TTL_CONTENIDO_SEGUNDOS = 300;

/** Envuelve una lectura del catastro en la caché etiquetada del contenido. */
function cacheContenido<A extends unknown[], R>(
  clave: string,
  consulta: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  return unstable_cache(consulta, [clave], {
    tags: [CONTENT_TAG],
    revalidate: TTL_CONTENIDO_SEGUNDOS,
  });
}

export const getConfig = cacheContenido('config', async (): Promise<AppConfig> => {
  const config = await prisma.config.findUnique({ where: { id: 'default' } });
  if (config) return { categorias: config.categorias as any };
  return { categorias: [] };
});

export const getDestinations = cacheContenido('destinations', async (): Promise<Destination[]> => {
  const data = await prisma.destination.findMany({ where: { activo: true }, orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
});

export const getDestinationByIdOrSlug = cacheContenido(
  'destination-by-id-or-slug',
  async (idOrSlug: string): Promise<Destination | null> => {
    try {
      const d = await prisma.destination.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      });
      if (!d) return null;
      return {
        ...d,
        coordenadas: d.coordenadas as unknown as Coordinates,
      } as Destination;
    } catch (error) {
      console.warn('Error fetching destination by id or slug:', error);
      return null;
    }
  }
);

const getDestinationsByCategoryCached = cacheContenido(
  'destinations-by-category',
  async (categoria: string): Promise<Destination[]> => {
    try {
      const data = await prisma.destination.findMany({ where: { categoria, activo: true }, orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
      return data.map((d) => ({
        ...d,
        coordenadas: d.coordenadas as unknown as Coordinates,
      })) as Destination[];
    } catch (error) {
      console.warn('Error fetching destinations by category:', error);
      return [];
    }
  }
);

export async function getDestinationsByCategory(categoria: string): Promise<Destination[]> {
  if (!categoria || categoria === 'todos') return getDestinations();
  return getDestinationsByCategoryCached(categoria);
}

export const getFeaturedDestinations = cacheContenido('featured-destinations', async (): Promise<Destination[]> => {
  const data = await prisma.destination.findMany({ where: { destacado: true, activo: true }, orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
});

export const getAccommodations = cacheContenido('accommodations', async (): Promise<Accommodation[]> => {
  const data = await prisma.accommodation.findMany({ where: { activo: true }, orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
  return data.map((a) => ({
    ...a,
    coordenadas: a.coordenadas as unknown as Coordinates,
    contacto: a.contacto as any,
  })) as Accommodation[];
});

export const getRestaurants = cacheContenido('restaurants', async (): Promise<Restaurant[]> => {
  const data = await prisma.restaurant.findMany({ where: { activo: true }, orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
  return data.map((r) => ({
    ...r,
    coordenadas: r.coordenadas as unknown as Coordinates,
    horario: r.horario as any,
    contacto: r.contacto as any,
  })) as Restaurant[];
});

export const getEvents = cacheContenido('events', async (): Promise<CumpeoEvent[]> => {
  try {
    const data = await prisma.event.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
    return data.map((e) => ({
      ...e,
      coordenadas: e.coordenadas as unknown as Coordinates | null,
    })) as CumpeoEvent[];
  } catch (error) {
    console.warn('Error fetching events from DB:', error);
    return [];
  }
});

export async function getActiveEvents(): Promise<CumpeoEvent[]> {
  return getEvents();
}

export const getEmergencyContacts = cacheContenido('emergency-contacts', async (): Promise<EmergencyContact[]> => {
  try {
    return await prisma.emergencyContact.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
  } catch (error) {
    console.warn('Error fetching emergency contacts:', error);
    return [];
  }
});

export async function getAllPOIs(): Promise<POI[]> {
  const [dests, accomm, rests, events] = await Promise.all([
    getDestinations(),
    getAccommodations(),
    getRestaurants(),
    getEvents(),
  ]);

  const pois: POI[] = [
    ...dests.map(d => ({
      id: d.id,
      nombre: d.nombre,
      descripcionCorta: d.descripcionCorta,
      categoria: d.categoria,
      tipo: 'destino' as const,
      coordenadas: d.coordenadas,
      imagenPrincipal: d.imagenPrincipal,
      rating: d.rating,
      _original: d
    })),
    ...accomm.map(a => ({
      id: a.id,
      nombre: a.nombre,
      descripcionCorta: a.descripcion,
      categoria: 'alojamiento',
      tipo: 'alojamiento' as const,
      coordenadas: a.coordenadas,
      imagenPrincipal: a.imagenPrincipal ?? undefined,
      rating: null,
      _original: a
    })),
    ...rests.map(r => ({
      id: r.id,
      nombre: r.nombre,
      descripcionCorta: r.descripcion,
      categoria: 'gastronomia',
      tipo: 'restaurante' as const,
      coordenadas: r.coordenadas,
      imagenPrincipal: r.imagenPrincipal ?? undefined,
      rating: null,
      _original: r
    })),
    ...events
      .filter((e): e is CumpeoEvent & { coordenadas: Coordinates } => Boolean(e.coordenadas))
      .map(e => ({
        id: e.id,
        nombre: e.nombre,
        descripcionCorta: e.descripcion,
        categoria: e.tipo,
        tipo: 'evento' as const,
        coordenadas: e.coordenadas,
        imagenPrincipal: e.imagenPrincipal ?? undefined,
        rating: null,
        _original: e
      }))
  ];

  return pois;
}

export function calcDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortByDistance(pois: POI[], userCoord: Coordinates): POI[] {
  return pois
    .map(p => ({
      ...p,
      distanciaKm: calcDistanceKm(userCoord, p.coordenadas)
    }))
    .sort((a, b) => (a.distanciaKm || 0) - (b.distanciaKm || 0));
}

export function formatDistance(km: number): string {
  if (km < 0.1) return 'Aquí mismo';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatPriceCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`;
}

export function getCategoryEmoji(_categoria: string): string {
  return '';
}

export function getCategoryColorClass(categoria: string): string {
  const map: Record<string, string> = {
    cultural: 'sol',
    historico: 'tierra',
    naturaleza: 'verde',
    gastronomia: 'rojo',
    patrimonio: 'cielo',
    entretencion: 'rojo',
    alojamiento: 'cielo',
    restaurante: 'rojo'
  };
  return map[categoria] || 'gray';
}

export function formatImgUrl(url?: string | null): string {
  if (!url || url.includes('placeholder')) return '/assets/images/placeholder.webp';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}

export const getTourRoutes = cacheContenido('tour-routes', async (): Promise<TourRoute[]> => {
  try {
    const data = await prisma.tourRoute.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
    if (data.length > 0) {
      return data as unknown as TourRoute[];
    }
  } catch (error) {
    console.warn('Error fetching tour routes from DB:', error);
  }
  return [];
});

/** Una ruta por id o slug, resuelta sobre la lista ya cacheada. */
export async function getTourRouteByIdOrSlug(idOrSlug: string): Promise<TourRoute | null> {
  const routes = await getTourRoutes();
  return routes.find((r) => r.id === idOrSlug || r.slug === idOrSlug) || null;
}


// ─── TEXTOS EDITABLES DEL SITIO ───────────────────────────────────────────────

/**
 * Lee los textos que un editor cambió desde el CMS.
 *
 * Va envuelto en unstable_cache y no lee cookies, para que las páginas que hoy
 * se generan estáticamente (/historia, /contacto) sigan haciéndolo: la consulta
 * se resuelve una vez y se invalida sola cuando alguien guarda un texto
 * (revalidateTag(SITE_TEXTS_TAG) en las server actions).
 *
 * Si la tabla no existe todavía o la base está caída devuelve {}, de modo que
 * el sitio siempre cae a los valores por defecto del código en vez de romperse.
 */
export const SITE_TEXTS_TAG = 'site-texts';

export const getSiteTexts = unstable_cache(
  async (): Promise<SiteTexts> => {
    try {
      const rows = await prisma.siteText.findMany({ select: { key: true, value: true } });
      const out: SiteTexts = {};
      rows.forEach((r) => {
        // Filtra claves huérfanas: textos guardados cuya clave ya no existe en
        // el registro del código no deben llegar a la página.
        if (isKnownSiteTextKey(r.key)) out[r.key] = r.value;
      });
      return out;
    } catch (error) {
      console.warn('Error fetching site texts from DB:', error);
      return {};
    }
  },
  ['site-texts'],
  { tags: [SITE_TEXTS_TAG] }
);

/**
 * Textos ya resueltos para renderizar: los valores por defecto del código con
 * los cambios del CMS aplicados encima.
 *
 * Es lo que recibe el proveedor del layout. Se envían resueltos (y no el
 * registro completo con etiquetas y ayudas) para no cargar al navegador del
 * visitante con datos que solo necesita el panel de administración.
 */
export async function getResolvedSiteTexts(): Promise<SiteTexts> {
  const overrides = await getSiteTexts();
  return { ...SITE_TEXT_DEFAULTS, ...overrides };
}

// ─── APARIENCIA EDITABLE DEL SITIO ────────────────────────────────────────────

/**
 * Lee la fila de apariencia que un editor haya guardado desde el CMS.
 *
 * Mismo patrón que getSiteTexts: envuelto en unstable_cache, sin leer cookies,
 * invalidado por revalidateTag(THEME_TAG) desde themeActions.ts. Si la tabla
 * no existe o la base está caída devuelve null, y el sitio cae a los valores
 * por defecto del código.
 */
export const THEME_TAG = 'theme-config';

export const getThemeOverrides = unstable_cache(
  async (): Promise<ThemeOverrides> => {
    try {
      const row = await prisma.themeConfig.findUnique({ where: { id: 'default' } });
      if (!row) return {};
      return {
        colorPrimario: row.colorPrimario,
        colorAcento: row.colorAcento,
        colorFondo: row.colorFondo,
        colorTexto: row.colorTexto,
        fontBody: row.fontBody,
        fontDisplay: row.fontDisplay,
      };
    } catch (error) {
      console.warn('Error fetching theme config from DB:', error);
      return {};
    }
  },
  ['theme-config'],
  { tags: [THEME_TAG] }
);

/** Apariencia ya resuelta para renderizar: por defecto + cambios del CMS. */
export async function getResolvedTheme(): Promise<ResolvedTheme> {
  const overrides = await getThemeOverrides();
  return resolveTheme(overrides);
}
