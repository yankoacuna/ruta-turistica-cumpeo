import { Destination, Accommodation, Restaurant, AppConfig, POI, Coordinates, TourRoute } from './types';

import destinationsData from '../../public/data/destinations.json';
import accommodationsData from '../../public/data/accommodations.json';
import restaurantsData from '../../public/data/restaurants.json';
import configData from '../../public/data/config.json';
import routesData from '../../public/data/routes.json';
export async function getConfig(): Promise<AppConfig> {
  return configData as unknown as AppConfig;
}

export async function getDestinations(): Promise<Destination[]> {
  return (destinationsData.destinos as unknown as Destination[]) || [];
}

export async function getDestinationByIdOrSlug(idOrSlug: string): Promise<Destination | null> {
  const dests = await getDestinations();
  return dests.find(d => d.id === idOrSlug || d.slug === idOrSlug) || null;
}

export async function getDestinationsByCategory(categoria: string): Promise<Destination[]> {
  const dests = await getDestinations();
  if (!categoria || categoria === 'todos') return dests;
  return dests.filter(d => d.categoria === categoria);
}

export async function getFeaturedDestinations(): Promise<Destination[]> {
  const dests = await getDestinations();
  return dests.filter(d => d.destacado);
}

export async function getAccommodations(): Promise<Accommodation[]> {
  return (accommodationsData.alojamientos as unknown as Accommodation[]) || [];
}

export async function getRestaurants(): Promise<Restaurant[]> {
  return (restaurantsData.restaurantes as unknown as Restaurant[]) || [];
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
      imagenPrincipal: a.imagenPrincipal,
      precio: typeof a.precio === 'object' ? `Desde $${a.precio.min?.toLocaleString('es-CL')}` : a.precio,
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
      imagenPrincipal: r.imagenPrincipal,
      precio: typeof r.precio === 'object' ? r.precio?.rango || '$' : r.precio,
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
