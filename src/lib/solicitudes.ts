import { SolicitudTipo, SolicitudEstado, SolicitudInput, Coordinates, Horario } from '@/lib/types';

/**
 * Reglas de las solicitudes que llegan del sitio público.
 *
 * Se valida acá, en el servidor, y no solo en el formulario: el endpoint es
 * público y cualquiera puede llamarlo sin pasar por la pantalla.
 */

export const TIPOS_SOLICITUD: SolicitudTipo[] = [
  'RESTAURANTE',
  'ALOJAMIENTO',
  'DESTINO',
  'EVENTO',
  'CONSULTA',
];

export const TIPO_LABEL: Record<SolicitudTipo, string> = {
  RESTAURANTE: 'Local de comida',
  ALOJAMIENTO: 'Alojamiento',
  DESTINO: 'Atractivo turístico',
  EVENTO: 'Evento o feria',
  CONSULTA: 'Consulta general',
};

export const ESTADO_LABEL: Record<SolicitudEstado, string> = {
  NUEVA: 'Nueva',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  PUBLICADA: 'Publicada',
};

/** Una consulta no trae datos de negocio: se valida distinto que una postulación. */
export const esPostulacion = (tipo: SolicitudTipo): boolean => tipo !== 'CONSULTA';

export const MAX_FOTOS = 3;

const LIMITES = {
  solicitanteNombre: 120,
  solicitanteEmail: 160,
  solicitanteTelefono: 40,
  solicitanteRol: 60,
  nombre: 140,
  descripcion: 2000,
  categoriaSugerida: 60,
  especialidad: 140,
  direccion: 250,
  telefono: 40,
  whatsapp: 40,
  email: 160,
  web: 200,
  instagram: 120,
  facebook: 200,
  fecha: 120,
  mensaje: 2000,
  itemLista: 60,
} as const;

const MIN_DESCRIPCION = 30;
const MIN_MENSAJE = 10;
const MAX_ITEMS_LISTA = 20;

/** Recorta, normaliza espacios y descarta caracteres de control. */
function texto(valor: unknown, max: number): string {
  if (typeof valor !== 'string') return '';
  return (
    valor
      .replace(/\r\n?/g, '\n')
      // Fuera los caracteres de control: no aportan nada a un texto escrito a
      // mano y ensucian tanto el panel como el correo de aviso.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, max)
  );
}

function lista(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => texto(item, LIMITES.itemLista))
    .filter(Boolean)
    .slice(0, MAX_ITEMS_LISTA);
}

/**
 * Validación de correo deliberadamente laxa: lo justo para atajar un error de
 * tipeo. Una expresión estricta rechaza direcciones válidas y deja fuera a un
 * emprendedor real, que es mucho peor que aceptar una dirección inválida.
 */
function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

/** Coordenadas dentro de Chile continental; fuera de eso, se descartan. */
function coordenadas(valor: unknown): Coordinates | null {
  if (!valor || typeof valor !== 'object') return null;
  const { lat, lng } = valor as Record<string, unknown>;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -56 || lat > -17 || lng < -76 || lng > -66) return null;
  return { lat, lng };
}

function horario(valor: unknown): Horario | null {
  if (!valor || typeof valor !== 'object') return null;
  const h = valor as Record<string, unknown>;
  const apertura = texto(h.apertura, 10);
  const cierre = texto(h.cierre, 10);
  const descripcion = texto(h.descripcion, 200);
  if (!apertura && !cierre && !descripcion) return null;
  return { apertura, cierre, descripcion };
}

/**
 * Las fotos se aceptan solo si son URLs del propio Storage: el cliente manda la
 * URL que le devolvió la subida, y sin esta comprobación podría guardar un
 * enlace a cualquier sitio, que después el CMS mostraría como si fuera propio.
 */
function fotos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  return valor
    .filter((url): url is string => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => base && url.startsWith(`${base}/storage/v1/object/public/`))
    .slice(0, MAX_FOTOS);
}

export interface SolicitudNormalizada {
  ok: boolean;
  data?: SolicitudInput;
  errores?: Record<string, string>;
}

/**
 * Convierte lo que llegó del formulario en una solicitud guardable.
 *
 * Devuelve los errores por campo (y no un mensaje único) para que el formulario
 * pueda marcar exactamente qué falta sin hacer que la persona relea todo.
 */
export function normalizarSolicitud(raw: unknown): SolicitudNormalizada {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errores: { general: 'No se recibieron datos.' } };
  }
  const cuerpo = raw as Record<string, unknown>;
  const errores: Record<string, string> = {};

  const tipo = TIPOS_SOLICITUD.includes(cuerpo.tipo as SolicitudTipo)
    ? (cuerpo.tipo as SolicitudTipo)
    : null;
  if (!tipo) {
    return { ok: false, errores: { tipo: 'Elige qué quieres solicitar.' } };
  }

  const solicitanteNombre = texto(cuerpo.solicitanteNombre, LIMITES.solicitanteNombre);
  const solicitanteEmail = texto(cuerpo.solicitanteEmail, LIMITES.solicitanteEmail).toLowerCase();
  const nombre = texto(cuerpo.nombre, LIMITES.nombre);
  const descripcion = texto(cuerpo.descripcion, LIMITES.descripcion);
  const mensaje = texto(cuerpo.mensaje, LIMITES.mensaje);
  const direccion = texto(cuerpo.direccion, LIMITES.direccion);
  const coords = coordenadas(cuerpo.coordenadas);

  if (solicitanteNombre.length < 3) {
    errores.solicitanteNombre = 'Escribe tu nombre completo.';
  }
  if (!emailValido(solicitanteEmail)) {
    errores.solicitanteEmail = 'Revisa tu correo: no parece una dirección válida.';
  }

  if (esPostulacion(tipo)) {
    if (nombre.length < 2) {
      errores.nombre = 'Falta el nombre del lugar o negocio.';
    }
    if (descripcion.length < MIN_DESCRIPCION) {
      errores.descripcion = `Cuéntanos un poco más: al menos ${MIN_DESCRIPCION} caracteres.`;
    }
    // Basta con una de las dos: hay negocios rurales sin dirección con número,
    // y gente que no logra ubicarse en el mapa. Exigir ambas deja fuera a unos u otros.
    if (!direccion && !coords) {
      errores.direccion = 'Indica dónde queda: una dirección o un punto en el mapa.';
    }
  } else {
    if (nombre.length < 2) {
      errores.nombre = 'Escribe el asunto de tu consulta.';
    }
    if (mensaje.length < MIN_MENSAJE) {
      errores.mensaje = 'Cuéntanos en qué podemos ayudarte.';
    }
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    data: {
      tipo,
      solicitanteNombre,
      solicitanteEmail,
      solicitanteTelefono: texto(cuerpo.solicitanteTelefono, LIMITES.solicitanteTelefono),
      solicitanteRol: texto(cuerpo.solicitanteRol, LIMITES.solicitanteRol),
      nombre,
      descripcion,
      categoriaSugerida: texto(cuerpo.categoriaSugerida, LIMITES.categoriaSugerida),
      especialidad: texto(cuerpo.especialidad, LIMITES.especialidad),
      direccion,
      coordenadas: coords,
      horario: horario(cuerpo.horario),
      telefono: texto(cuerpo.telefono, LIMITES.telefono),
      whatsapp: texto(cuerpo.whatsapp, LIMITES.whatsapp),
      email: texto(cuerpo.email, LIMITES.email).toLowerCase(),
      web: texto(cuerpo.web, LIMITES.web),
      instagram: texto(cuerpo.instagram, LIMITES.instagram),
      facebook: texto(cuerpo.facebook, LIMITES.facebook),
      servicios: lista(cuerpo.servicios),
      mediosPago: lista(cuerpo.mediosPago),
      fecha: texto(cuerpo.fecha, LIMITES.fecha),
      fotos: fotos(cuerpo.fotos),
      mensaje,
    },
  };
}
