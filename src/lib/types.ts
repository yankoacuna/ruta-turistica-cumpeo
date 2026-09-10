export interface Coordinates {
  lat: number;
  lng: number;
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
  horario: string;
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
  horario?: {
    apertura?: string;
    cierre?: string;
    diasCierre?: string[];
    descripcion?: string;
  } | string | null;
  imagenPrincipal?: string | null;
  galeria?: string[];
  menuUrl?: string | null;
  tags?: string[];
  activo?: boolean;
  publicado?: boolean;
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
  tipo: 'fiesta-religiosa' | 'feria' | 'centro-evento' | 'cultural' | string;
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
