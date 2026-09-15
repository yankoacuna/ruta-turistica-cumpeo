/**
 * Nombres legibles para los códigos que devuelve geoip-lite (país ISO 3166-1
 * alfa-2, región según su base de datos offline). Se cubren Chile completo
 * (Cumpeo está en la región del Maule) y los orígenes de turistas más
 * frecuentes; lo que no está mapeado se muestra tal cual llegó.
 */

export const PAIS_LABEL: Record<string, string> = {
  CL: 'Chile',
  AR: 'Argentina',
  PE: 'Perú',
  BO: 'Bolivia',
  BR: 'Brasil',
  CO: 'Colombia',
  UY: 'Uruguay',
  PY: 'Paraguay',
  EC: 'Ecuador',
  VE: 'Venezuela',
  MX: 'México',
  US: 'Estados Unidos',
  CA: 'Canadá',
  ES: 'España',
  FR: 'Francia',
  DE: 'Alemania',
  IT: 'Italia',
  GB: 'Reino Unido',
};

/** ISO 3166-2:CL, las 16 regiones de Chile. */
export const REGION_LABEL_CL: Record<string, string> = {
  AP: 'Arica y Parinacota',
  TA: 'Tarapacá',
  AN: 'Antofagasta',
  AT: 'Atacama',
  CO: 'Coquimbo',
  VS: 'Valparaíso',
  RM: 'Región Metropolitana',
  LI: "O'Higgins",
  ML: 'Maule',
  NB: 'Ñuble',
  BI: 'Biobío',
  AR: 'La Araucanía',
  LR: 'Los Ríos',
  LL: 'Los Lagos',
  AI: 'Aysén',
  MA: 'Magallanes',
};

export function nombrePais(codigo: string | null): string {
  if (!codigo) return 'Desconocido';
  return PAIS_LABEL[codigo.toUpperCase()] || codigo;
}

export function nombreRegion(paisCodigo: string | null, regionCodigo: string | null): string | null {
  if (!regionCodigo) return null;
  if (paisCodigo?.toUpperCase() === 'CL') {
    return REGION_LABEL_CL[regionCodigo.toUpperCase()] || regionCodigo;
  }
  return regionCodigo;
}

/** "Maule, Chile" / "Chile" / "Desconocido", para una sola celda o etiqueta. */
export function ubicacionLegible(
  pais: string | null,
  region: string | null,
  ciudad?: string | null
): string {
  const partes = [ciudad || null, nombreRegion(pais, region), pais ? nombrePais(pais) : null].filter(
    Boolean
  ) as string[];
  return partes.length > 0 ? partes.join(', ') : 'Desconocido';
}
