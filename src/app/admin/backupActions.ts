'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from './authActions';

export async function exportDatabaseBackup() {
  await requireRole(['ADMIN']);
  const [
    destinations,
    restaurants,
    accommodations,
    events,
    config,
    tourRoutes,
    emergencyContacts,
  ] = await Promise.all([
    prisma.destination.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.restaurant.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.accommodation.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.event.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.config.findFirst(),
    prisma.tourRoute.findMany({ orderBy: { orden: 'asc' } }),
    prisma.emergencyContact.findMany({ orderBy: { orden: 'asc' } }),
  ]);

  return {
    version: '1.2',
    exportDate: new Date().toISOString(),
    site: 'Turismo Cumpeo',
    data: {
      destinations,
      restaurants,
      accommodations,
      events,
      config,
      tourRoutes,
      emergencyContacts,
    },
  };
}

export async function restoreDatabaseBackup(backupData: any) {
  await requireRole(['ADMIN']);

  if (!backupData?.data) {
    throw new Error('Formato de copia de seguridad inválido');
  }

  const { destinations, restaurants, accommodations, events, tourRoutes, emergencyContacts } =
    backupData.data;

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

  // Restore Events
  if (Array.isArray(events)) {
    for (const ev of events) {
      await prisma.event.upsert({
        where: { id: ev.id },
        update: { ...ev },
        create: { ...ev },
      });
    }
  }

  // Restore Tour Routes
  if (Array.isArray(tourRoutes)) {
    for (const tr of tourRoutes) {
      await prisma.tourRoute.upsert({
        where: { id: tr.id },
        update: { ...tr },
        create: { ...tr },
      });
    }
  }

  // Restore Emergency Contacts
  if (Array.isArray(emergencyContacts)) {
    for (const ec of emergencyContacts) {
      await prisma.emergencyContact.upsert({
        where: { id: ec.id },
        update: { ...ec },
        create: { ...ec },
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/mapa');
  revalidatePath('/ruta');
  return { success: true };
}
