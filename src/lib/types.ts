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
    facebook?: string;
  } | null;
  servicios?: string[];
  imagenPrincipal?: string | null;
  galeria?: string[];
  activo?: boolean;
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
    facebook?: string;
  } | null;
  mediosPago?: string[];      // desde catastro: ["Efectivo", "Débito"]
  horario?: Horario | string | null;
  imagenPrincipal?: string | null;
  galeria?: string[];
  menuUrl?: string | null;
  tags?: string[];
  activo?: boolean;
  /** Orden manual en la portada: menor primero, empate resuelto por nombre. */
  orden?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface EmergencyContact {
  id: string;
  institucion: string;
  telefono: string;
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
  fecha?: string | null;       // "1 de enero" / "Fines de semana"
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
  hitos?: RouteMilestone[] | null;
  consejos?: RouteTip[] | null;
  /** Minutos extra a sumar por parada (aparte del tiempo de manejo), por id de POI. */
  tiemposParada?: Record<string, number> | null;
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
  /** true si la contraseña actual la asignó un admin (alta o reseteo) y falta que el usuario la cambie. */
  mustChangePassword?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  mustChangePassword?: boolean;
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

// ─── APARIENCIA EDITABLE DEL SITIO ────────────────────────────────────────────

/** Apariencia guardada desde el CMS. Un campo en null usa el valor por defecto. */
export interface ThemeConfigRecord {
  colorPrimario: string | null;
  colorAcento: string | null;
  colorFondo: string | null;
  colorTexto: string | null;
  fontBody: string | null;
  fontDisplay: string | null;
  /** ISO string: las fechas viajan serializadas al cliente. */
  updatedAt: string;
  updatedByEmail?: string | null;
  updatedByNombre?: string | null;
}

/** Lo que envía el formulario del CMS al guardar. */
export interface ThemeSaveInput {
  colorPrimario?: string | null;
  colorAcento?: string | null;
  colorFondo?: string | null;
  colorTexto?: string | null;
  fontBody?: string | null;
  fontDisplay?: string | null;
}

/** Destinatarios del aviso por correo de Solicitudes nuevas. */
export interface NotificacionesConfigRecord {
  emails: string[];
  /** ISO string: las fechas viajan serializadas al cliente. */
  updatedAt: string;
  updatedByEmail?: string | null;
  updatedByNombre?: string | null;
}

// ─── VISITAS DEL SITIO PÚBLICO ────────────────────────────────────────────────

/** Períodos que ofrece el selector del panel de visitantes. */
export type VisitRangoPreset =
  | 'hoy'
  | '7d'
  | '30d'
  | 'mes-actual'
  | 'mes-pasado'
  /** Rango libre: el panel manda las fechas de inicio y fin. */
  | 'personalizado';

/**
 * Métricas de visitas que muestra el dashboard del CMS.
 *
 * El indicador principal es "visitantes" (dispositivos distintos): "visitas"
 * cuenta cada página abierta, así que un mismo turista recorriendo el sitio
 * infla esa cifra sin que haya llegado más gente. Las visitas quedan como dato
 * secundario, para leer cuánto explora cada persona.
 *
 * `disponible: false` significa que no se pudo consultar la tabla: el panel lo
 * avisa en vez de mostrar ceros que parecerían "no vino nadie".
 */
export interface VisitStats {
  disponible: boolean;
  preset: VisitRangoPreset;
  /** Nombre del período tal como se muestra: "Hoy", "Septiembre 2026", etc. */
  rangoLabel: string;
  /** 'hora' solo en el período "Hoy"; el resto se grafica por día. */
  granularidad: 'dia' | 'hora';
  visitasHoy: number;
  visitantesHoy: number;
  visitas7: number;
  visitantes7: number;
  visitasRango: number;
  visitantesRango: number;
  sesionesRango: number;
  visitasTotal: number;
  visitantesTotal: number;
  /** Fecha ISO de la primera visita registrada, para mostrar desde cuándo se mide. */
  midiendoDesde: string | null;
  /** Un tramo por barra del gráfico: "2026-09-13" por día, "2026-09-13T14" por hora. */
  serie: Array<{ clave: string; visitas: number; visitantes: number }>;
  paginas: Array<{ path: string; titulo: string | null; visitas: number; visitantes: number }>;
  secciones: Array<{ seccion: string; visitas: number; visitantes: number }>;
  dispositivos: Array<{ device: string; visitas: number; visitantes: number }>;
  origenes: Array<{ referrer: string; visitas: number; visitantes: number }>;
  /** De dónde llegan los visitantes, resuelto con geoip-lite a partir de la IP (que nunca se guarda). */
  ubicaciones: Array<{ pais: string | null; region: string | null; visitas: number; visitantes: number }>;
}

/** Una fila cruda de PageView, para la tabla de visitas individuales del panel. */
export interface VisitaDetalle {
  id: string;
  createdAt: string;
  path: string;
  titulo: string | null;
  seccion: string;
  device: string | null;
  referrer: string | null;
  pais: string | null;
  region: string | null;
  ciudad: string | null;
}

/** Página del listado paginado de visitas individuales. */
export interface VisitasDetalle {
  disponible: boolean;
  filas: VisitaDetalle[];
  total: number;
  pagina: number;
  porPagina: number;
}

// ─── SOLICITUDES DEL SITIO PÚBLICO ────────────────────────────────────────────

/** Qué está pidiendo quien escribe: sumar su negocio, o una consulta general. */
export type SolicitudTipo = 'RESTAURANTE' | 'ALOJAMIENTO' | 'DESTINO' | 'EVENTO' | 'CONSULTA';

/**
 * Ciclo de vida de una solicitud dentro del municipio:
 * NUEVA → EN_REVISION → APROBADA → PUBLICADA (o RECHAZADA en cualquier punto).
 */
export type SolicitudEstado = 'NUEVA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PUBLICADA';

/** Lo que envía el formulario público. Todo llega como texto y se valida en el servidor. */
export interface SolicitudInput {
  tipo: SolicitudTipo;
  solicitanteNombre: string;
  solicitanteEmail: string;
  solicitanteTelefono?: string;
  solicitanteRol?: string;
  nombre: string;
  descripcion: string;
  categoriaSugerida?: string;
  especialidad?: string;
  direccion?: string;
  coordenadas?: Coordinates | null;
  horario?: Horario | null;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  web?: string;
  instagram?: string;
  facebook?: string;
  servicios?: string[];
  mediosPago?: string[];
  fecha?: string;
  fotos?: string[];
  mensaje?: string;
}

/** Una solicitud tal como la lee el panel. */
export interface SolicitudRecord extends Omit<SolicitudInput, 'coordenadas' | 'horario'> {
  id: string;
  estado: SolicitudEstado;
  coordenadas?: Coordinates | null;
  horario?: Horario | null;
  notaInterna?: string | null;
  revisadoPorId?: string | null;
  revisadoPorNombre?: string | null;
  revisadoEn?: string | Date | null;
  /** Ficha creada a partir de esta solicitud, para no publicarla dos veces. */
  publicadoComoId?: string | null;
  publicadoComoTipo?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** Resultado del envío del formulario público. */
export interface SolicitudEnvioResult {
  ok: boolean;
  id?: string;
  /** Mensajes por campo, para marcar el que falta sin perder lo ya escrito. */
  errores?: Record<string, string>;
  error?: string;
}
