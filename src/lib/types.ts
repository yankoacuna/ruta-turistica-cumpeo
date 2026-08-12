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
  precio: string;
  duracionVisita?: string;
  comoLlegar?: string;
  tags?: string[];
  destacado: boolean;
  imagenPrincipal?: string;
  galeria?: string[];
  infoUtil?: Record<string, string>;
  rating?: number;
}

export interface Accommodation {
  id: string;
  nombre: string;
  tipo?: string;
  descripcion: string;
  coordenadas: Coordinates;
  direccion?: string | null;
  contacto?: {
    telefono?: string;
    whatsapp?: string;
    email?: string;
    web?: string;
    instagram?: string;
  } | null;
  servicios?: string[];
  precio?: {
    min?: number;
    max?: number;
    moneda?: string;
    descripcion?: string;
  } | string | null;
  imagenPrincipal?: string | null;
  galeria?: string[];
}

export interface Restaurant {
  id: string;
  nombre: string;
  especialidad?: string;
  descripcion: string;
  coordenadas: Coordinates;
  direccion?: string | null;
  contacto?: {
    telefono?: string;
    whatsapp?: string;
    email?: string;
    web?: string;
    instagram?: string;
  } | null;
  platoEstrella?: string;
  horario?: {
    apertura?: string;
    cierre?: string;
    diasCierre?: string[];
    descripcion?: string;
  } | string | null;
  precio?: {
    rango?: string;
    promedioPersona?: number;
    min?: number;
    max?: number;
    moneda?: string;
    descripcion?: string;
  } | string | null;
  imagenPrincipal?: string | null;
  galeria?: string[];
  menuUrl?: string | null;
  tags?: string[];
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
  tipo: 'destino' | 'alojamiento' | 'restaurante';
  coordenadas: Coordinates;
  imagenPrincipal?: string;
  precio?: string;
  rating?: number | null;
  distanciaKm?: number;
  _original?: Destination | Accommodation | Restaurant;
}

export interface TourRoute {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  poiIds: string[];
}
