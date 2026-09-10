export interface Coordinates {
  lat: number;
  lng: number;
}

export type DiaSemana = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';

/**
 * Cómo funciona el horario de un lugar:
 * - 'fijo': tiene apertura/cierre diarios (un restaurante, un local).
 * - 'siempre-abierto': acceso libre sin horario (una plaza, un monumento).
 * - 'consultar': variable o no aplica un horario diario (fechas de eventos, "según disponibilidad").
 */
export type HorarioModo = 'fijo' | 'siempre-abierto' | 'consultar';

/** Horario de atención estructurado: usado por Restaurante y Destino. */
export interface Horario {
  modo?: HorarioModo; // por defecto: 'fijo' si hay apertura y cierre, si no 'consultar'
  apertura?: string; // "10:00" (solo aplica con modo 'fijo')
  cierre?: string; // "18:00" (solo aplica con modo 'fijo')
  diasCierre?: DiaSemana[]; // días sin atención; vacío o ausente = abre todos los días (solo modo 'fijo')
  descripcion?: string; // nota libre: excepciones (fijo), detalle de acceso (siempre-abierto) o instrucción (consultar)
}

export interface Destination {
  id: string;
  slug: string;
  nombre: string;
  categoria: 'cultural' | 'historico' | 'naturaleza' | 'gastronomia' | 'patrimonio' | 'entretencion';
  descripcionCorta: string;
  descripcionLarga: string;
  historia: string;
  coordenadas: Coordinates;
  direccion: string;
  horario?: Horario | string | null;
  duracionVisita?: string;
  comoLlegar?: string;
  tags?: string[];
  destacado: boolean;
  imagenPrincipal?: string;
  galeria?: string[];
  infoUtil?: Record<string, string>;
  rating?: number;
  activo?: boolean;
  publicado?: boolean;
  /** Orden manual en la portada: menor primero, empate resuelto por nombre. */
  orden?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Accommodation {
  id: string;
  nombre: string;
  tipo?: string;
  propietario?: string | null;  // desde catastro
  descripcion: string;
  coordenadas: Coordinates;
  direccion?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  contacto?: {
    telefono?: string;
    whatsapp?: string;
    email?: string;
    web?: string;
    instagram?: string;
  } | null;
  servicios?: string[];
  imagenPrincipal?: string | null;
  galeria?: string[];
  activo?: boolean;
  publicado?: boolean;
  /** Orden manual en la portada: menor primero, empate resuelto por nombre. */
  orden?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Restaurant {
  id: string;
  nombre: string;
  tipo?: string;              // restaurante, picada, bar, cafeteria...
  especialidad?: string;
  propietario?: string | null; // desde catastro
  descripcion: string;
  coordenadas: Coordinates;
  direccion?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  contacto?: {
    telefono?: string;
    whatsapp?: string;
    email?: string;
    web?: string;
    instagram?: string;
  } | null;
  mediosPago?: string[];      // desde catastro: ["Efectivo", "Débito"]
  horario?: Horario | string | null;
  imagenPrincipal?: string | null;
  galeria?: string[];
  menuUrl?: string | null;
  tags?: string[];
  activo?: boolean;
  publicado?: boolean;
  /** Orden manual en la portada: menor primero, empate resuelto por nombre. */
  orden?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface EmergencyContact {
  id: string;
  institucion: string;
  telefono: string;
  icono?: string | null;
  direccion?: string | null;
  orden: number;
  activo: boolean;
}

export interface CumpeoEvent {
  id: string;
  nombre: string;
  /** Categorías tal como las entregó el catastro municipal (excel). */
  tipo: 'fiestas-religiosas' | 'ferias-libres' | 'centros-de-evento' | string;
  descripcion: string;
  descripcionLarga?: string | null;
  fecha?: string | null;       // "20 de enero" / "Fines de semana"
  recurrente: boolean;
  coordenadas?: Coordinates | null;
  direccion?: string | null;
  imagenPrincipal?: string | null;
  galeria?: string[];
  tags?: string[];
  destacado: boolean;
  activo: boolean;
  /** Orden manual en la portada: menor primero, empate resuelto por nombre. */
  orden?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AppConfig {
  nombreSitio?: string;
  subtitulo?: string;
  region?: string;
  pais?: string;
  version?: string;
  coordenadasCentro?: Coordinates;
  zoomInicial?: number;
  categorias?: Array<{
    id: string;
    nombre: string;
    emoji: string;
    color: string;
    imagen?: string;
  }>;
  redesSociales?: Record<string, string>;
  informacionTuristica?: {
    oficina: string;
    telefono: string;
    email: string;
    horario: string;
  };
}

export interface POI {
  id: string;
  nombre: string;
  descripcionCorta: string;
  categoria: string;
  tipo: 'destino' | 'alojamiento' | 'restaurante' | 'evento';
  coordenadas: Coordinates;
  imagenPrincipal?: string;
  rating?: number | null;
  distanciaKm?: number;
  _original?: Destination | Accommodation | Restaurant | CumpeoEvent;
}

export interface RouteMilestone {
  numero: number;
  titulo: string;
  descripcion: string;
}

export interface RouteTip {
  icono?: string;
  titulo: string;
  texto: string;
}

export interface TourRoute {
  id: string;
  slug?: string;
  nombre: string;
  descripcion: string;
  color: string;
  poiIds: string[];
  duracionEstimada?: string | null;
  distanciaKm?: number | null;
  dificultad?: string | null;
  hitos?: RouteMilestone[] | any | null;
  consejos?: RouteTip[] | any | null;
  mapaImagen?: string | null;
  destacada?: boolean;
  activo?: boolean;
  orden?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type UserRole = 'ADMIN' | 'EDITOR' | 'LECTOR';

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  activo: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
}

// ─── TEXTOS EDITABLES DEL SITIO ───────────────────────────────────────────────

/** Un texto que fue modificado desde el CMS, con su última auditoría. */
export interface SiteTextRecord {
  key: string;
  value: string;
  /** ISO string: las fechas viajan serializadas al cliente. */
  updatedAt: string;
  updatedByEmail?: string | null;
  updatedByNombre?: string | null;
}

/** Una entrada de la bitácora de cambios de un texto. */
export interface SiteTextRevisionRecord {
  id: string;
  key: string;
  valorAnterior: string | null;
  valorNuevo: string;
  /** editar | restaurar | original */
  accion: string;
  autorEmail?: string | null;
  autorNombre?: string | null;
  createdAt: string;
}

/**
 * Resultado de guardar un texto. Devuelve el valor vigente resuelto para que
 * quien llama no necesite conocer los valores por defecto del código.
 */
export interface SiteTextSaveResult {
  key: string;
  /** Lo que hay que mostrar ahora en el sitio. */
  valorVigente: string;
  /** true si el texto volvió al valor original del código. */
  esOriginal: boolean;
  /** El registro guardado, o null si se descartó el cambio. */
  record: SiteTextRecord | null;
}

/** Respuesta al preguntar si quien mira el sitio puede editarlo en vivo. */
export interface EditModeAccess {
  canEdit: boolean;
  user: { nombre: string; email: string; role: UserRole } | null;
}

/** Catastros cuyo orden en la portada se puede administrar. */
export type OrderableEntity = 'destinos' | 'restaurantes' | 'alojamientos' | 'eventos';
