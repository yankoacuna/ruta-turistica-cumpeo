'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from './authActions';

export async function bulkImportEntitiesAction(
  entityType: 'destinos' | 'restaurantes' | 'alojamientos' | 'eventos',
  items: any[],
  mode: 'upsert' | 'create_only' = 'upsert'
) {
  await requireRole(['ADMIN', 'EDITOR']);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (entityType === 'destinos') {
      const existingById = item.id ? await prisma.destination.findUnique({ where: { id: item.id } }) : null;
      const existingBySlug = item.slug ? await prisma.destination.findUnique({ where: { slug: item.slug } }) : null;
      const existing = existingById || existingBySlug;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.destination.update({
          where: { id: existing.id },
          data: {
            nombre: item.nombre,
            categoria: item.categoria,
            descripcionCorta: item.descripcionCorta,
            descripcionLarga: item.descripcionLarga || item.descripcionCorta,
            historia: item.historia || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            horario: item.horario || null,
            duracionVisita: item.duracionVisita || null,
            comoLlegar: item.comoLlegar || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.destination.create({
          data: {
            id: item.id,
            slug: item.slug || item.id,
            nombre: item.nombre,
            categoria: item.categoria,
            descripcionCorta: item.descripcionCorta,
            descripcionLarga: item.descripcionLarga || item.descripcionCorta,
            historia: item.historia || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            horario: item.horario || null,
            duracionVisita: item.duracionVisita || null,
            comoLlegar: item.comoLlegar || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    } else if (entityType === 'restaurantes') {
      const existing = item.id ? await prisma.restaurant.findUnique({ where: { id: item.id } }) : null;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.restaurant.update({
          where: { id: item.id },
          data: {
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            especialidad: item.especialidad || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            mediosPago: item.mediosPago || [],
            tags: item.tags || [],
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.restaurant.create({
          data: {
            id: item.id,
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            especialidad: item.especialidad || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            mediosPago: item.mediosPago || [],
            tags: item.tags || [],
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    } else if (entityType === 'alojamientos') {
      const existing = item.id ? await prisma.accommodation.findUnique({ where: { id: item.id } }) : null;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.accommodation.update({
          where: { id: item.id },
          data: {
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            servicios: item.servicios || [],
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.accommodation.create({
          data: {
            id: item.id,
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            servicios: item.servicios || [],
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    } else if (entityType === 'eventos') {
      const existing = item.id ? await prisma.event.findUnique({ where: { id: item.id } }) : null;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.event.update({
          where: { id: item.id },
          data: {
            nombre: item.nombre,
            tipo: item.tipo,
            descripcion: item.descripcion,
            fecha: item.fecha || null,
            recurrente: Boolean(item.recurrente),
            coordenadas: item.coordenadas || null,
            direccion: item.direccion || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.event.create({
          data: {
            id: item.id,
            nombre: item.nombre,
            tipo: item.tipo,
            descripcion: item.descripcion,
            fecha: item.fecha || null,
            recurrente: Boolean(item.recurrente),
            coordenadas: item.coordenadas || null,
            direccion: item.direccion || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/mapa');
  revalidatePath('/ruta');

  return {
    success: true,
    createdCount,
    updatedCount,
    skippedCount,
    totalProcessed: items.length,
  };
}
