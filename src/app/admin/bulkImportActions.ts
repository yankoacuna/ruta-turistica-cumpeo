'use server';

import { prisma } from '@/lib/prisma';
import { invalidarContenidoPublico } from '@/lib/revalidate';
import { sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';
import { ENTIDADES, TipoEntidad, buildFieldsData } from '@/lib/entidades';
import { modeloDe } from '@/lib/prismaModelo';

type BulkEntityType = 'destinos' | 'restaurantes' | 'alojamientos' | 'eventos';

const TIPO_A_MODELO: Record<BulkEntityType, TipoEntidad> = {
  destinos: 'destination',
  restaurantes: 'restaurant',
  alojamientos: 'accommodation',
  eventos: 'event',
};

/** Tamaño de lote para las transacciones: ni una por fila (miles de viajes a
 * la base) ni todo el archivo junto (una transacción larga en un hosting
 * compartido puede superar el tiempo máximo que MySQL le permite). */
const TAMANO_LOTE = 100;

function enLotes<T>(items: T[], tamano: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) lotes.push(items.slice(i, i + tamano));
  return lotes;
}

/**
 * Carga masiva desde el asistente de Excel/JSON del panel.
 *
 * Cada fila ya llega parseada por `bulkValidator.ts` (que corre en el
 * navegador antes de esto: reconoce columnas del Excel, convierte tipos y
 * resuelve el id/slug de cada fila). Acá se vuelve a validar con el mismo
 * esquema Zod que usa el guardado individual —el navegador no es de
 * confianza aunque ya haya filtrado— y se escribe en lotes transaccionales:
 * o queda el lote completo, o no queda nada de él. Los registros existentes se
 * resuelven en una sola consulta, no una por fila.
 */
export async function bulkImportEntitiesAction(
  entityType: BulkEntityType,
  items: unknown[],
  mode: 'upsert' | 'create_only' = 'upsert'
): Promise<
  Resultado<{
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    totalProcessed: number;
  }>
> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  if (!Array.isArray(items) || items.length === 0) {
    return fallo('VALIDACION', 'No recibimos registros para importar.');
  }

  const modelo = TIPO_A_MODELO[entityType];
  const descriptor = modelo ? ENTIDADES[modelo] : undefined;
  if (!descriptor) {
    return fallo('VALIDACION', `Catastro desconocido: ${entityType}`);
  }

  // Una fila invalida se descarta sin abortar el resto del archivo: es el
  // mismo criterio que ya aplicaba el asistente al filtrar antes de mandar.
  const filas: Array<{ id: string; slug?: string; datos: Record<string, unknown> }> = [];
  let skippedCount = 0;

  for (const item of items) {
    const validado = descriptor.esquema.safeParse(item);
    if (!validado.success) {
      skippedCount++;
      continue;
    }
    const limpio = validado.data as Record<string, unknown> & { id?: string };
    const id = limpio.id;
    if (!id) {
      skippedCount++;
      continue;
    }
    // El slug no vive en el esquema de guardado individual (ahí lo deriva el
    // servidor del nombre), pero la carga masiva sí lo trae ya resuelto desde
    // el Excel/JSON; se preserva tal cual en vez de recalcularlo, para no
    // desacordar el id que ya vio `bulkValidator.ts` del id que se escribe acá.
    const slugCrudo = (item as Record<string, unknown> | null)?.slug;
    const slug = descriptor.hasSlug && typeof slugCrudo === 'string' ? slugCrudo : undefined;
    filas.push({ id, slug, datos: buildFieldsData(limpio, descriptor.campos) });
  }

  if (filas.length === 0) {
    return fallo('VALIDACION', 'Ningún registro pasó la validación.');
  }

  const ids = filas.map((f) => f.id);
  const existentesRaw: Array<{ id: string }> = await modeloDe(modelo).findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const existentes = new Set(existentesRaw.map((r) => r.id));

  let createdCount = 0;
  let updatedCount = 0;

  for (const lote of enLotes(filas, TAMANO_LOTE)) {
    const operaciones = lote
      .filter((fila) => {
        if (existentes.has(fila.id) && mode === 'create_only') {
          skippedCount++;
          return false;
        }
        return true;
      })
      .map((fila) => {
        const esNuevo = !existentes.has(fila.id);
        if (esNuevo) createdCount++;
        else updatedCount++;

        return esNuevo
          ? modeloDe(modelo).create({
              data: {
                id: fila.id,
                ...(descriptor.hasSlug ? { slug: fila.slug || fila.id } : {}),
                ...fila.datos,
              },
            })
          : modeloDe(modelo).update({ where: { id: fila.id }, data: fila.datos });
      });

    if (operaciones.length > 0) {
      await prisma.$transaction(operaciones);
    }
  }

  invalidarContenidoPublico();

  return exito({
    createdCount,
    updatedCount,
    skippedCount,
    totalProcessed: items.length,
  });
}
