'use server';

import { prisma } from '@/lib/prisma';
import { Destination, Restaurant, Accommodation } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'cumpeo2026';
const SESSION_COOKIE_NAME = 'admin_session_token';

// ─── AUTHENTICATION HELPERS ───────────────────────────────────────────────────

function generateSessionToken(): string {
  return crypto.createHmac('sha256', ADMIN_SECRET).update('cumpeo_admin_logged_in').digest('hex');
}

export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  // Check password against environment variables or default
  const validPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin123';

  if (password !== validPassword && password !== ADMIN_SECRET) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  const token = generateSessionToken();
  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath('/admin');
  return true;
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie) return false;

  const expected = generateSessionToken();
  return cookie.value === expected;
}

async function assertAuthorized(token?: string) {
  // Check direct token or check HTTP-only cookie
  if (token && (token === ADMIN_SECRET || token === process.env.ADMIN_PASSWORD)) {
    return;
  }
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error('No autorizado: Sesión de administración requerida');
  }
}

// ─── DESTINATIONS ─────────────────────────────────────────────────────────────

export async function saveDestination(token: string, data: Partial<Destination>) {
  await assertAuthorized(token);
  const slug =
    data.slug ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-dest';
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
      galeria: data.galeria ?? [],
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
      coordenadas: (data.coordenadas as any) || { lat: -35.267, lng: -71.25 },
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
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  revalidatePath('/destino/[slug]', 'page');
  return result;
}

export async function deleteDestination(token: string, id: string) {
  await assertAuthorized(token);
  await prisma.destination.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────

export async function saveRestaurant(token: string, data: Partial<Restaurant>) {
  await assertAuthorized(token);
  const id =
    data.id ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-rest';

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
      coordenadas: (data.coordenadas as any) || { lat: -35.267, lng: -71.25 },
      direccion: data.direccion,
      horario: data.horario as any,
      precio: data.precio as any,
      tags: data.tags ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      menuUrl: data.menuUrl,
      contacto: data.contacto as any,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteRestaurant(token: string, id: string) {
  await assertAuthorized(token);
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── ACCOMMODATIONS ───────────────────────────────────────────────────────────

export async function saveAccommodation(token: string, data: Partial<Accommodation>) {
  await assertAuthorized(token);
  const id =
    data.id ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-acc';

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
      coordenadas: (data.coordenadas as any) || { lat: -35.267, lng: -71.25 },
      direccion: data.direccion,
      precio: data.precio as any,
      servicios: data.servicios ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      contacto: data.contacto as any,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteAccommodation(token: string, id: string) {
  await assertAuthorized(token);
  await prisma.accommodation.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── BACKUP & RESTORE ─────────────────────────────────────────────────────────

export async function exportDatabaseBackup(token?: string) {
  await assertAuthorized(token);
  const [destinations, restaurants, accommodations, config] = await Promise.all([
    prisma.destination.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.restaurant.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.accommodation.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.config.findFirst(),
  ]);

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    site: 'Cumpeo Turismo',
    data: {
      destinations,
      restaurants,
      accommodations,
      config,
    },
  };
}

export async function restoreDatabaseBackup(token: string, backupData: any) {
  await assertAuthorized(token);

  if (!backupData?.data) {
    throw new Error('Formato de copia de seguridad inválido');
  }

  const { destinations, restaurants, accommodations } = backupData.data;

  // Restore Destinations
  if (Array.isArray(destinations)) {
    for (const d of destinations) {
      await prisma.destination.upsert({
        where: { id: d.id },
        update: { ...d },
        create: { ...d },
      });
    }
  }

  // Restore Restaurants
  if (Array.isArray(restaurants)) {
    for (const r of restaurants) {
      await prisma.restaurant.upsert({
        where: { id: r.id },
        update: { ...r },
        create: { ...r },
      });
    }
  }

  // Restore Accommodations
  if (Array.isArray(accommodations)) {
    for (const a of accommodations) {
      await prisma.accommodation.upsert({
        where: { id: a.id },
        update: { ...a },
        create: { ...a },
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return { success: true };
}
