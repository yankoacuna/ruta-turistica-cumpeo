'use server';

import { prisma } from '@/lib/prisma';
import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const ADMIN_TOKEN = process.env.ADMIN_SECRET;

function validateToken(token: string) {
  if (token !== ADMIN_TOKEN) {
    throw new Error('Token inválido o no autorizado');
  }
}

// ─── DESTINATIONS ─────────────────────────────────────────────────────────────

export async function saveDestination(token: string, data: Partial<Destination>) {
  validateToken(token);
  const slug = data.slug || data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'new-dest';
  const id = data.id || slug;

  const result = await prisma.destination.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      categoria: data.categoria,
      descripcionCorta: data.descripcionCorta,
      descripcionLarga: data.descripcionLarga,
      historia: data.historia,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      horario: data.horario,
      precio: data.precio,
      duracionVisita: data.duracionVisita,
      comoLlegar: data.comoLlegar,
      tags: data.tags,
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria,
      rating: data.rating,
      destacado: data.destacado,
    },
    create: {
      id,
      slug,
      nombre: data.nombre || 'Nuevo Destino',
      categoria: data.categoria || 'cultural',
      descripcionCorta: data.descripcionCorta || '',
      descripcionLarga: data.descripcionLarga,
      historia: data.historia,
      coordenadas: data.coordenadas as any || { lat: -35.267, lng: -71.250 },
      direccion: data.direccion,
      horario: data.horario,
      precio: data.precio,
      duracionVisita: data.duracionVisita,
      comoLlegar: data.comoLlegar,
      tags: data.tags || [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria || [],
      rating: data.rating,
      destacado: data.destacado || false,
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  revalidatePath('/destino/[slug]', 'page');
  return result;
}

export async function deleteDestination(token: string, id: string) {
  validateToken(token);
  await prisma.destination.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────

export async function saveRestaurant(token: string, data: Partial<Restaurant>) {
  validateToken(token);
  const id = data.id || data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'new-rest';

  const result = await prisma.restaurant.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      horario: data.horario as any,
      precio: data.precio as any,
      tags: data.tags ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      menuUrl: data.menuUrl,
      contacto: data.contacto as any,
    },
    create: {
      id,
      nombre: data.nombre || 'Nuevo Restaurante',
      descripcion: data.descripcion || '',
      coordenadas: data.coordenadas as any || { lat: -35.267, lng: -71.250 },
      direccion: data.direccion,
      horario: data.horario as any,
      precio: data.precio as any,
      tags: data.tags ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      menuUrl: data.menuUrl,
      contacto: data.contacto as any,
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteRestaurant(token: string, id: string) {
  validateToken(token);
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── ACCOMMODATIONS ───────────────────────────────────────────────────────────

export async function saveAccommodation(token: string, data: Partial<Accommodation>) {
  validateToken(token);
  const id = data.id || data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'new-acc';

  const result = await prisma.accommodation.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      precio: data.precio as any,
      servicios: data.servicios ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      contacto: data.contacto as any,
    },
    create: {
      id,
      nombre: data.nombre || 'Nuevo Alojamiento',
      descripcion: data.descripcion || '',
      coordenadas: data.coordenadas as any || { lat: -35.267, lng: -71.250 },
      direccion: data.direccion,
      precio: data.precio as any,
      servicios: data.servicios ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      contacto: data.contacto as any,
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteAccommodation(token: string, id: string) {
  validateToken(token);
  await prisma.accommodation.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}
