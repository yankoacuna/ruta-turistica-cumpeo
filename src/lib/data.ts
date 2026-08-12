import { Destination, Accommodation, Restaurant, AppConfig, POI, Coordinates, TourRoute } from './types';
import { prisma } from './prisma';
import routesData from '../../public/data/routes.json';

export async function getConfig(): Promise<AppConfig> {
  const config = await prisma.config.findUnique({ where: { id: 'default' } });
  if (config) return { categorias: config.categorias as any };
  return { categorias: [] };
}

export async function getDestinations(): Promise<Destination[]> {
  const data = await prisma.destination.findMany({ orderBy: { nombre: 'asc' } });
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
  const data = await prisma.destination.findMany({ where: { categoria }, orderBy: { nombre: 'asc' } });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
}

export async function getFeaturedDestinations(): Promise<Destination[]> {
  const data = await prisma.destination.findMany({ where: { destacado: true }, orderBy: { nombre: 'asc' } });
  return data.map((d) => ({
    ...d,
    coordenadas: d.coordenadas as unknown as Coordinates,
  })) as Destination[];
}

export async function getAccommodations(): Promise<Accommodation[]> {
  const data = await prisma.accommodation.findMany({ orderBy: { nombre: 'asc' } });
  return data.map((a) => ({
    ...a,
    coordenadas: a.coordenadas as unknown as Coordinates,
    precio: a.precio as any,
    contacto: a.contacto as any,
  })) as Accommodation[];
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const data = await prisma.restaurant.findMany({ orderBy: { nombre: 'asc' } });
  return data.map((r) => ({
    ...r,
    coordenadas: r.coordenadas as unknown as Coordinates,
    horario: r.horario as any,
    precio: r.precio as any,
    contacto: r.contacto as any,
  })) as Restaurant[];
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
      precio: d.precio,
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
      precio: typeof a.precio === 'object' && a.precio ? `Desde $${(a.precio as any).min?.toLocaleString('es-CL')}` : (a.precio as any),
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
      precio: typeof r.precio === 'object' && r.precio ? (r.precio as any).rango || '$' : (r.precio as any),
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

export function getCategoryEmoji(categoria: string): string {
  const map: Record<string, string> = {
    cultural: '🎨',
    historico: '🏛️',
    naturaleza: '🌿',
    gastronomia: '🍽️',
    patrimonio: '🏺',
    entretencion: '🎉',
    alojamiento: '🛏️',
    restaurante: '🍴'
  };
  return map[categoria] || '📍';
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
  if (!url) return '/assets/images/placeholder.webp';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}

export async function getTourRoutes(): Promise<TourRoute[]> {
  return (routesData as unknown as TourRoute[]) || [];
}
