import { z } from 'zod';
import { CENTRO_CUMPEO } from './constants';
import { DestinoSchema, RestauranteSchema, AlojamientoSchema, EventoSchema } from './esquemas';

/**
 * Forma de cada tipo de lugar del catastro, en un solo lugar.
 *
 * Antes esto vivía repartido: qué campos se persisten estaba en
 * `entityActions.ts`, cómo se validan en `esquemas.ts`, y la carga masiva
 * (`bulkImportActions.ts`) repetía su propio mapeo de campos por tipo, sin
 * relación con ninguno de los dos. Agregar un campo nuevo a una entidad
 * significaba acordarse de tocar los tres, y nada avisaba si alguno quedaba
 * desalineado con los demás.
 *
 * Ahora `entityActions.ts` y `bulkImportActions.ts` leen el mismo descriptor:
 * la validación (`esquema`) y la persistencia (`campos`) no se pueden
 * desalinear porque son la misma fuente.
 */
export type TipoEntidad = 'destination' | 'restaurant' | 'accommodation' | 'event';

/** Campo simple (se guarda tal cual llega) o con un valor de reemplazo cuando viene nulo/vacío. */
export type FieldSpec = string | { key: string; coalesce: unknown };

export interface DescriptorEntidad {
  modelo: TipoEntidad;
  /** Valida y sanea lo que llega desde el cliente (guardado individual o carga masiva). */
  esquema: z.ZodType<any>;
  /** Qué campos se escriben en Prisma a partir de los datos ya validados. */
  campos: FieldSpec[];
  /** Solo se aplican al crear un registro nuevo, y solo si el campo llega vacío. */
  createDefaults: Record<string, unknown>;
  /** Solo Destination tiene columna `slug` propia; los demás derivan el id directo del nombre. */
  hasSlug: boolean;
  idFallback: string;
  /** Cómo se nombra el tipo en avisos y mensajes de error: "destino", "restaurante"... */
  etiqueta: string;
}

/** "Plaza de Cumpeo" -> "plaza-de-cumpeo". */
export function slugFromNombre(nombre?: string): string {
  return nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
}

/** Arma los datos a persistir a partir de la lista de campos del descriptor. */
export function buildFieldsData(data: Record<string, any>, campos: FieldSpec[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of campos) {
    if (typeof f === 'string') out[f] = data[f];
    else out[f.key] = data[f.key] ?? f.coalesce;
  }
  return out;
}

export const ENTIDADES: Record<TipoEntidad, DescriptorEntidad> = {
  destination: {
    modelo: 'destination',
    esquema: DestinoSchema,
    hasSlug: true,
    idFallback: 'new-dest',
    etiqueta: 'destino',
    campos: [
      'nombre', 'categoria', 'descripcionCorta', 'descripcionLarga', 'historia',
      'coordenadas', 'direccion', 'horario', 'duracionVisita', 'comoLlegar', 'tags',
      'imagenPrincipal', { key: 'galeria', coalesce: [] }, 'rating', 'destacado',
      { key: 'activo', coalesce: true },
    ],
    createDefaults: {
      nombre: 'Nuevo Destino', categoria: 'cultural', descripcionCorta: '',
      coordenadas: CENTRO_CUMPEO, tags: [], destacado: false,
    },
  },
  restaurant: {
    modelo: 'restaurant',
    esquema: RestauranteSchema,
    hasSlug: false,
    idFallback: 'new-rest',
    etiqueta: 'restaurante',
    campos: [
      'nombre', 'tipo', 'descripcion', 'especialidad', 'propietario', 'coordenadas',
      'direccion', 'horario', { key: 'mediosPago', coalesce: [] },
      { key: 'tags', coalesce: [] }, 'imagenPrincipal', { key: 'galeria', coalesce: [] },
      'menuUrl', 'contacto', { key: 'activo', coalesce: true },
    ],
    createDefaults: { nombre: 'Nuevo Restaurante', descripcion: '', coordenadas: CENTRO_CUMPEO },
  },
  accommodation: {
    modelo: 'accommodation',
    esquema: AlojamientoSchema,
    hasSlug: false,
    idFallback: 'new-acc',
    etiqueta: 'alojamiento',
    campos: [
      'nombre', 'tipo', 'propietario', 'descripcion', 'coordenadas', 'direccion',
      { key: 'servicios', coalesce: [] }, 'imagenPrincipal',
      { key: 'galeria', coalesce: [] }, 'contacto', { key: 'activo', coalesce: true },
    ],
    createDefaults: { nombre: 'Nuevo Alojamiento', descripcion: '', coordenadas: CENTRO_CUMPEO },
  },
  event: {
    modelo: 'event',
    esquema: EventoSchema,
    hasSlug: false,
    idFallback: 'new-event',
    etiqueta: 'evento',
    campos: [
      'nombre', 'tipo', 'descripcion', 'descripcionLarga', 'fecha',
      { key: 'recurrente', coalesce: true }, 'coordenadas', 'direccion', 'imagenPrincipal',
      { key: 'galeria', coalesce: [] }, { key: 'tags', coalesce: [] },
      { key: 'destacado', coalesce: false }, { key: 'activo', coalesce: true },
    ],
    // Un evento nuevo sin coordenadas no recibe una por defecto, a diferencia
    // de los otros tres tipos.
    createDefaults: { nombre: 'Nuevo Evento', tipo: 'ferias-libres', descripcion: '' },
  },
};
