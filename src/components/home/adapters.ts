import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { getCategoryColorClass } from '@/lib/data';
import { getBadgeStyle } from './badgeStyles';
import type { CatalogItem } from './CatalogSection';

/** Destino -> tarjeta (enlaza a su ficha, sin acciones de contacto) */
export function destinationToCard(d: Destination): CatalogItem {
  return {
    id: d.id,
    nombre: d.nombre,
    imagen: d.imagenPrincipal,
    badge: d.categoria,
    badgeClass: getBadgeStyle(getCategoryColorClass(d.categoria)),
    descripcion: d.descripcionCorta,
    direccion: d.direccion,
    href: `/destino/${d.slug}`,
    filterId: d.categoria,
  };
}

/** Restaurante -> tarjeta (con estado de apertura y acciones de contacto) */
export function restaurantToCard(r: Restaurant): CatalogItem {
  return {
    id: r.id,
    nombre: r.nombre,
    imagen: r.imagenPrincipal,
    badge: r.tipo || 'Restaurante',
    badgeClass: 'bg-[#FFE0E2] text-rojo border-[#FFA8AE]',
    descripcion: r.descripcion,
    direccion: r.direccion,
    propietario: r.propietario,
    tags: r.mediosPago,
    telefono: r.telefono,
    whatsapp: r.whatsapp,
    instagram: r.contacto?.instagram,
    facebook: r.contacto?.facebook,
    coords: r.coordenadas,
    horario: r.horario,
  };
}

/** Alojamiento -> tarjeta */
export function accommodationToCard(a: Accommodation): CatalogItem {
  return {
    id: a.id,
    nombre: a.nombre,
    imagen: a.imagenPrincipal,
    badge: a.tipo || 'Alojamiento',
    badgeClass: 'bg-sol/20 text-tierra-dark border-sol/40',
    descripcion: a.descripcion,
    direccion: a.direccion,
    propietario: a.propietario,
    tags: a.servicios,
    telefono: a.telefono,
    whatsapp: a.whatsapp,
    instagram: a.contacto?.instagram,
    facebook: a.contacto?.facebook,
    coords: a.coordenadas,
  };
}
