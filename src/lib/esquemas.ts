import { z } from 'zod';

/**
 * Reglas de validación de lo que el panel guarda en el catastro.
 *
 * Los server actions son endpoints HTTP públicos y TypeScript no existe en
 * tiempo de ejecución, así que todo lo que llega se valida acá antes de tocar
 * la base.
 *
 * Dos convenciones a respetar al editar estos esquemas:
 *
 * 1. Casi todo es opcional. El panel guarda fichas completas y parciales con la
 *    misma acción, y un campo ausente significa "no lo toques": un .default()
 *    convertiría una edición parcial en un borrado de los demás campos.
 *
 * 2. Las claves desconocidas se descartan (comportamiento por defecto de Zod).
 *    El formulario manda la ficha entera, con createdAt y updatedAt incluidos,
 *    y esos no se escriben desde acá.
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
 * Coordenadas dentro de Chile continental, mismo rango que aplica el formulario
 * público (src/lib/solicitudes.ts).
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

// ─── EXPORTACIÓN / RESTAURACIÓN DEL CATASTRO ──────────────────────────────────
// Usados solo para validar un archivo de respaldo antes de restaurarlo
// (src/app/admin/backupActions.ts). No tienen formulario propio en el panel.

export const ContactoEmergenciaSchema = z.object({
  id: texto(140).min(1, 'Falta el id'),
  institucion: texto(140).min(1, 'Falta la institución'),
  telefono: texto(40).min(1, 'Falta el teléfono'),
  direccion: texto(250).nullable().optional(),
  orden: z.number().int().min(0).max(100000).optional(),
  activo: z.boolean().optional(),
});

export const ConfigSchema = z.object({
  id: texto(40).optional(),
  categorias: z.array(z.record(z.string(), z.unknown())).max(100),
});

// ─── USUARIOS DEL PANEL ───────────────────────────────────────────────────────

/**
 * Validación de correo deliberadamente laxa, igual que en el formulario
 * público: una expresión estricta rechaza direcciones válidas y deja fuera a
 * una persona real.
 */
const correo = () =>
  z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Revisa el correo: no parece una dirección válida');

export const RolSchema = z.enum(['ADMIN', 'EDITOR', 'LECTOR']);

export const UsuarioNuevoSchema = z.object({
  email: correo(),
  nombre: texto(120).min(2, 'El nombre es obligatorio'),
  role: RolSchema,
});

export const UsuarioEdicionSchema = z.object({
  nombre: texto(120).min(2, 'El nombre es obligatorio').optional(),
  role: RolSchema.optional(),
  activo: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

/** Largo mínimo de una contraseña elegida por el usuario (no la temporal, que es aleatoria). */
export const MIN_LARGO_CLAVE = 8;

export const CambioClaveSchema = z.object({
  actual: z.string().min(1, 'Escribe tu contraseña actual'),
  nueva: z.string().min(MIN_LARGO_CLAVE, `La nueva contraseña debe tener al menos ${MIN_LARGO_CLAVE} caracteres`).max(200),
});
