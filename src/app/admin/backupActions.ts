'use server';

import { prisma } from '@/lib/prisma';
import { invalidarContenidoPublico } from '@/lib/revalidate';
import { sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';
import { ENTIDADES, TipoEntidad } from '@/lib/entidades';
import { RutaSchema, ContactoEmergenciaSchema, ConfigSchema } from '@/lib/esquemas';
import { saveSiteTexts } from './siteTextActions';
import { saveTheme } from './themeActions';
import { saveNotificaciones } from './notificacionesActions';
import type { z } from 'zod';

/**
 * Exportación del catastro completo del sitio, para respaldo o traspaso.
 *
 * A propósito no incluye usuarios ni solicitudes: son credenciales y datos
 * personales de terceros, que no deberían viajar en un archivo que puede
 * terminar en un pendrive municipal. Para eso, un `mysqldump` desde cPanel es
 * el mecanismo correcto. Esto es una exportación del catastro y del contenido
 * editable (textos, apariencia, notificaciones), no una copia de seguridad
 * completa del sistema.
 */
export async function exportDatabaseBackup() {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  const [
    destinations,
    restaurants,
    accommodations,
    events,
    config,
    tourRoutes,
    emergencyContacts,
    siteTexts,
    theme,
    notificaciones,
  ] = await Promise.all([
    prisma.destination.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.restaurant.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.accommodation.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.event.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.config.findFirst(),
    prisma.tourRoute.findMany({ orderBy: { orden: 'asc' } }),
    prisma.emergencyContact.findMany({ orderBy: { orden: 'asc' } }),
    prisma.siteText.findMany(),
    prisma.themeConfig.findUnique({ where: { id: 'default' } }),
    prisma.notificacionesConfig.findUnique({ where: { id: 'default' } }),
  ]);

  return exito({
    version: '1.3',
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
      siteTexts,
      theme,
      notificaciones,
    },
  });
}

/** Ni una fila por vez (miles de viajes a la base) ni el archivo entero junto
 * (una transacción larga puede superar el tiempo máximo que MySQL permite en
 * este hosting compartido). */
const TAMANO_LOTE = 100;
/** Un archivo con miles de filas por colección es casi seguro un error de
 * carga, no un catastro real de este tamaño de comuna. */
const MAX_FILAS_POR_COLECCION = 2000;

function enLotes<T>(items: T[], tamano: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) lotes.push(items.slice(i, i + tamano));
  return lotes;
}

/** Valida una colección completa contra un esquema; no escribe nada. */
function validarColeccion(
  nombre: string,
  filas: unknown,
  esquema: z.ZodType<any>
): { ok: true; filas: Record<string, any>[] } | { ok: false; error: string } {
  if (filas === undefined) return { ok: true, filas: [] };
  if (!Array.isArray(filas)) {
    return { ok: false, error: `"${nombre}" debería ser una lista y no lo es.` };
  }
  if (filas.length > MAX_FILAS_POR_COLECCION) {
    return { ok: false, error: `"${nombre}" trae ${filas.length} filas; el máximo es ${MAX_FILAS_POR_COLECCION}.` };
  }
  for (const fila of filas) {
    const validado = esquema.safeParse(fila);
    if (!validado.success || !(fila as any)?.id) {
      return { ok: false, error: `Hay una fila inválida en "${nombre}"; no se aplicó ningún cambio.` };
    }
  }
  // Se restaura la fila tal como llegó, no la versión "limpia" de Zod: acá
  // solo se usa el esquema como filtro de seguridad contra un archivo
  // corrupto o ajeno, no para reformatear un respaldo legítimo.
  return { ok: true, filas: filas as Record<string, any>[] };
}

async function restaurarColeccion(modelo: TipoEntidad | 'tourRoute' | 'emergencyContact', filas: Record<string, any>[]) {
  for (const lote of enLotes(filas, TAMANO_LOTE)) {
    await prisma.$transaction(
      lote.map((fila) => (prisma[modelo] as any).upsert({ where: { id: fila.id }, update: { ...fila }, create: { ...fila } }))
    );
  }
}

/**
 * Restaura un catastro exportado con `exportDatabaseBackup`.
 *
 * Antes esto tomaba el JSON del archivo y lo volcaba con `upsert` directo,
 * un `await` por fila, sin validar la forma ni envolver nada en una
 * transacción: un archivo con arrays enormes bloqueaba el proceso, y una
 * falla a mitad de camino dejaba la base a medio restaurar sin forma de
 * volver atrás. Ahora se valida **todo** el archivo primero —una sola fila
 * inválida en cualquier colección rechaza el archivo entero, sin tocar la
 * base— y recién después se escribe, en lotes transaccionales.
 */
export async function restoreDatabaseBackup(backupData: any): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  if (!backupData?.data || typeof backupData.data !== 'object') {
    return fallo('VALIDACION', 'El archivo no tiene el formato de una copia de seguridad.');
  }
  const d = backupData.data;

  // Fase 1: validar todo, sin escribir nada.
  const colecciones = [
    validarColeccion('destinations', d.destinations, ENTIDADES.destination.esquema),
    validarColeccion('restaurants', d.restaurants, ENTIDADES.restaurant.esquema),
    validarColeccion('accommodations', d.accommodations, ENTIDADES.accommodation.esquema),
    validarColeccion('events', d.events, ENTIDADES.event.esquema),
    validarColeccion('tourRoutes', d.tourRoutes, RutaSchema),
    validarColeccion('emergencyContacts', d.emergencyContacts, ContactoEmergenciaSchema),
  ] as const;

  for (const resultado of colecciones) {
    if (!resultado.ok) {
      return fallo('VALIDACION', resultado.error);
    }
  }
  const [destinations, restaurants, accommodations, events, tourRoutes, emergencyContacts] = colecciones.map(
    (r) => (r as { ok: true; filas: Record<string, any>[] }).filas
  );

  if (d.config !== undefined && d.config !== null) {
    const validado = ConfigSchema.safeParse(d.config);
    if (!validado.success) {
      return fallo('VALIDACION', '"config" no tiene el formato esperado.');
    }
  }

  // Fase 2: escribir. El catastro primero, en lotes transaccionales.
  await restaurarColeccion('destination', destinations);
  await restaurarColeccion('restaurant', restaurants);
  await restaurarColeccion('accommodation', accommodations);
  await restaurarColeccion('event', events);
  await restaurarColeccion('tourRoute', tourRoutes);
  await restaurarColeccion('emergencyContact', emergencyContacts);

  if (d.config) {
    const { id: _id, ...datos } = d.config;
    await prisma.config.upsert({
      where: { id: 'default' },
      update: datos,
      create: { id: 'default', ...datos },
    });
  }

  // Contenido editable: cada uno reusa su propia acción, que ya valida y
  // revalida lo suyo (textos conocidos, colores hexadecimales, correos).
  if (Array.isArray(d.siteTexts)) {
    const entries = d.siteTexts
      .filter((t: any) => typeof t?.key === 'string' && typeof t?.value === 'string')
      .map((t: any) => ({ key: t.key, value: t.value }));
    if (entries.length > 0) {
      const res = await saveSiteTexts(entries);
      if (!res.ok) return res;
    }
  }
  if (d.theme) {
    const res = await saveTheme(d.theme);
    if (!res.ok) return res;
  }
  if (d.notificaciones?.emails) {
    const res = await saveNotificaciones(d.notificaciones.emails);
    if (!res.ok) return res;
  }

  invalidarContenidoPublico();
  return exito(true);
}
