import { Destination, Accommodation, Restaurant, AppConfig, POI, Coordinates, TourRoute, CumpeoEvent, EmergencyContact } from './types';
import { prisma } from './prisma';

export async function getConfig(): Promise<AppConfig> {
  const config = await prisma.config.findUnique({ where: { id: 'default' } });
  if (config) return { categorias: config.categorias as any };
  return { categorias: [] };
}

export async function getDestinations(): Promise<Destination[]> {
  const data = await prisma.destination.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
}

export async function getDestinationByIdOrSlug(idOrSlug: string): Promise<Destination | null> {
  const d = await prisma.destination.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
  });
  if (!d) return null;
  return {
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  } as Destination;
}

export async function getDestinationsByCategory(categoria: string): Promise<Destination[]> {
  if (!categoria || categoria === 'todos') return getDestinations();
  const data = await prisma.destination.findMany({ where: { categoria, activo: true }, orderBy: { nombre: 'asc' } });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
}

export async function getFeaturedDestinations(): Promise<Destination[]> {
  const data = await prisma.destination.findMany({ where: { destacado: true, activo: true }, orderBy: { nombre: 'asc' } });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
}

export async function getAccommodations(): Promise<Accommodation[]> {
  const data = await prisma.accommodation.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  return data.map((a) => ({
    ...a,
    coordenadas: a.coordenadas as unknown as Coordinates,
    contacto: a.contacto as any,
  })) as Accommodation[];
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const data = await prisma.restaurant.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  return data.map((r) => ({
    ...r,
    coordenadas: r.coordenadas as unknown as Coordinates,
    horario: r.horario as any,
    contacto: r.contacto as any,
  })) as Restaurant[];
}

export async function getEvents(): Promise<CumpeoEvent[]> {
  try {
    const data = await prisma.event.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return data.map((e) => ({
      ...e,
      coordenadas: e.coordenadas as unknown as Coordinates | null,
    })) as CumpeoEvent[];
  } catch (error) {
    console.warn('Error fetching events from DB:', error);
    return [];
  }
}

export async function getActiveEvents(): Promise<CumpeoEvent[]> {
  return getEvents();
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    return await prisma.emergencyContact.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
  } catch (error) {
    console.warn('Error fetching emergency contacts:', error);
    return [];
  }
}

export async function getAllPOIs(): Promise<POI[]> {
  const [dests, accomm, rests] = await Promise.all([
    getDestinations(),
    getAccommodations(),
    getRestaurants()
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

export async function getTourRoutes(): Promise<TourRoute[]> {
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
}

export async function getTourRouteByIdOrSlug(idOrSlug: string): Promise<TourRoute | null> {
  try {
    const route = await prisma.tourRoute.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        activo: true,
      },
    });
    if (route) return route as unknown as TourRoute;
  } catch (error) {
    console.warn('Error fetching tour route by id/slug from DB:', error);
  }
  const routes = await getTourRoutes();
  return routes.find((r) => r.id === idOrSlug || r.slug === idOrSlug) || null;
}

