import { z } from 'zod';

/**
 * Reglas de lo que el panel puede guardar en el catastro.
 *
 * Por qué existe: `saveDestination(data: Partial<Destination>)` confiaba en que
 * el navegador mandara lo que el tipo declara, y TypeScript no existe en tiempo
 * de ejecución. Los server actions son endpoints HTTP públicos: `coordenadas`
 * podía llegar como "hola", `rating` como texto, `nombre` con dos megas y
 * `categoria` con un valor que no está en el catálogo. La lista blanca de
 * campos de entityActions evitaba escribir en columnas ajenas, pero no miraba
 * el contenido — y lo que se guarda es lo que después muestra el sitio público.
 *
 * Dos decisiones que conviene tener presentes al editar esto:
 *
 * 1. Casi todo es opcional a propósito. El panel guarda fichas completas y
 *    parciales con la misma acción, y un campo ausente significa "no lo toques",
 *    no "déjalo vacío". Poner un .default() donde había undefined haría que
 *    editar el teléfono borrara la descripción.
 *
 * 2. Las claves desconocidas se descartan en silencio (comportamiento por
 *    defecto de Zod). Es lo que queremos: el formulario manda la ficha entera,
 *    con createdAt y updatedAt incluidos, y esos no se guardan desde acá.
 */

/** Errores por campo, con el formato que espera `Resultado.detalles`. */
export function detallesDeZod(error: z.ZodError): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || 'general';
    // El primer error de cada campo es el que se muestra: acumular tres
    // mensajes sobre el mismo input no ayuda a nadie a corregirlo.
    if (!salida[campo]) salida[campo] = issue.message;
  }
  return salida;
}

const texto = (max: number) => z.string().trim().max(max);

/** Lista de textos cortos: etiquetas, servicios, medios de pago. */
const listaDeTextos = (maxItems: number, maxLargo = 80) =>
  z.array(z.string().trim().max(maxLargo)).max(maxItems);

/** Ruta o URL de una imagen. El largo se acota; el origen lo resuelve formatImgUrl. */
const imagen = () => texto(500);

/**
 * Coordenadas dentro de Chile continental. Mismo criterio que ya usa el
 * formulario público (src/lib/solicitudes.ts): un punto en otro continente es
 * siempre un error de carga, no un dato que valga la pena guardar.
 */
export const CoordenadasSchema = z.object({
  lat: z.number().min(-56, 'Latitud fuera de Chile').max(-17, 'Latitud fuera de Chile'),
  lng: z.number().min(-76, 'Longitud fuera de Chile').max(-66, 'Longitud fuera de Chile'),
});

/** Horario estructurado; el catastro antiguo también acepta una nota libre. */
export const HorarioSchema = z.object({
  modo: z.enum(['fijo', 'siempre-abierto', 'consultar']).optional(),
  apertura: texto(10).optional(),
  cierre: texto(10).optional(),
  diasCierre: z.array(z.enum(['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'])).max(7).optional(),
  descripcion: texto(300).optional(),
});

const horarioFlexible = z.union([HorarioSchema, texto(300), z.null()]);

export const ContactoSchema = z.object({
  telefono: texto(40).optional(),
  whatsapp: texto(40).optional(),
  email: texto(160).optional(),
  web: texto(200).optional(),
  instagram: texto(120).optional(),
  facebook: texto(200).optional(),
});

/** Campos que toda ficha comparte con el guardado genérico de entityActions. */
const camposComunes = {
  /** Presente = se edita una ficha existente; ausente = se crea una nueva. */
  id: texto(140).optional(),
  orden: z.number().int().min(0).max(100000).optional(),
  activo: z.boolean().optional(),
  direccion: texto(250).nullable().optional(),
  imagenPrincipal: imagen().nullable().optional(),
  galeria: listaDeTextos(30, 500).optional(),
};

export const DestinoSchema = z.object({
  ...camposComunes,
  nombre: texto(140).min(2, 'El nombre es obligatorio').optional(),
  // El catálogo es cerrado: la portada y el mapa pintan cada categoría con su
  // color, y una categoría inventada saldría sin estilo en el sitio.
  categoria: z
    .enum(['cultural', 'historico', 'naturaleza', 'gastronomia', 'patrimonio', 'entretencion'])
    .optional(),
  descripcionCorta: texto(300).optional(),
  descripcionLarga: texto(8000).nullable().optional(),
  historia: texto(8000).nullable().optional(),
  coordenadas: CoordenadasSchema.optional(),
  horario: horarioFlexible.optional(),
  duracionVisita: texto(80).nullable().optional(),
  comoLlegar: texto(1000).nullable().optional(),
  tags: listaDeTextos(20).optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  destacado: z.boolean().optional(),
});

export const RestauranteSchema = z.object({
  ...camposComunes,
  nombre: texto(140).min(2, 'El nombre es obligatorio').optional(),
  tipo: texto(60).nullable().optional(),
  descripcion: texto(4000).optional(),
  especialidad: texto(140).nullable().optional(),
  propietario: texto(140).nullable().optional(),
  coordenadas: CoordenadasSchema.optional(),
  telefono: texto(40).nullable().optional(),
  whatsapp: texto(40).nullable().optional(),
  horario: horarioFlexible.optional(),
  mediosPago: listaDeTextos(20).optional(),
  tags: listaDeTextos(20).optional(),
  menuUrl: texto(500).nullable().optional(),
  contacto: ContactoSchema.nullable().optional(),
});

export const AlojamientoSchema = z.object({
  ...camposComunes,
  nombre: texto(140).min(2, 'El nombre es obligatorio').optional(),
  tipo: texto(60).nullable().optional(),
  propietario: texto(140).nullable().optional(),
  descripcion: texto(4000).optional(),
  coordenadas: CoordenadasSchema.optional(),
  telefono: texto(40).nullable().optional(),
  whatsapp: texto(40).nullable().optional(),
  servicios: listaDeTextos(30).optional(),
  contacto: ContactoSchema.nullable().optional(),
});

export const EventoSchema = z.object({
  ...camposComunes,
  nombre: texto(140).min(2, 'El nombre es obligatorio').optional(),
  tipo: texto(60).optional(),
  descripcion: texto(4000).optional(),
  descripcionLarga: texto(8000).nullable().optional(),
  // Texto libre y no fecha real a propósito: el catastro guarda cosas como
  // "20 de enero" o "fines de semana de marzo".
  fecha: texto(120).nullable().optional(),
  recurrente: z.boolean().optional(),
  coordenadas: CoordenadasSchema.nullable().optional(),
  tags: listaDeTextos(20).optional(),
  destacado: z.boolean().optional(),
});

/** Hito numerado dentro de una ruta turística. */
const HitoSchema = z.object({
  numero: z.number().int().min(0).max(999).optional(),
  titulo: texto(140).optional(),
  descripcion: texto(2000).optional(),
});

const ConsejoSchema = z.object({
  titulo: texto(140).optional(),
  texto: texto(2000).optional(),
});

export const RutaSchema = z.object({
  id: texto(140).optional(),
  slug: texto(140).optional(),
  nombre: texto(140).min(2, 'El nombre es obligatorio').optional(),
  descripcion: texto(4000).optional(),
  // Hex de 3 o 6 dígitos: este valor se inyecta como color en el mapa y en las
  // tarjetas de la portada.
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'El color debe ser un hexadecimal como #E63946')
    .optional(),
  poiIds: listaDeTextos(100, 140).optional(),
  duracionEstimada: texto(80).nullable().optional(),
  distanciaKm: z.number().min(0).max(10000).nullable().optional(),
  dificultad: texto(40).nullable().optional(),
  hitos: z.array(HitoSchema).max(50).nullable().optional(),
  consejos: z.array(ConsejoSchema).max(50).nullable().optional(),
  tiemposParada: z.record(z.string().max(140), z.number().min(0).max(100000)).nullable().optional(),
  mapaImagen: imagen().nullable().optional(),
  destacada: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).max(100000).optional(),
});

/** Ids en el orden en que deben quedar los catastros de la portada. */
export const OrdenSchema = z.array(texto(140)).max(500);
