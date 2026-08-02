/**
 * data.js — Cumpeo Turismo
 * Módulo de carga y gestión de datos JSON
 */

// ── Versión de la app (para cache busting) ────────────────
const APP_VERSION = '1.0.0';

const DATA_BASE = './data/';

// Cache en memoria
const _cache = {};

/**
 * Carga un archivo JSON, con caché en memoria.
 * @param {string} filename - nombre del archivo sin ruta
 * @returns {Promise<Object>}
 */
async function loadJSON(filename) {
  if (_cache[filename]) return _cache[filename];
  try {
    const res = await fetch(`${DATA_BASE}${filename}?v=${APP_VERSION}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${filename}`);
    const data = await res.json();
    _cache[filename] = data;
    return data;
  } catch (err) {
    console.error('[Data] Error cargando:', filename, err);
    throw err;
  }
}


// ── API pública del módulo ─────────────────────────────────

/**
 * Carga la configuración global de la app.
 * @returns {Promise<Object>}
 */
export async function getConfig() {
  return loadJSON('config.json');
}

/**
 * Carga todos los destinos turísticos.
 * @returns {Promise<Array>}
 */
export async function getDestinations() {
  const data = await loadJSON('destinations.json');
  return data.destinos || [];
}

/**
 * Obtiene un destino por su ID o slug.
 * @param {string} idOrSlug
 * @returns {Promise<Object|null>}
 */
export async function getDestinationById(idOrSlug) {
  const dests = await getDestinations();
  return dests.find(d => d.id === idOrSlug || d.slug === idOrSlug) || null;
}

/**
 * Filtra destinos por categoría.
 * @param {string} categoria
 * @returns {Promise<Array>}
 */
export async function getDestinationsByCategory(categoria) {
  const dests = await getDestinations();
  if (!categoria || categoria === 'todos') return dests;
  return dests.filter(d => d.categoria === categoria);
}

/**
 * Obtiene los destinos destacados.
 * @returns {Promise<Array>}
 */
export async function getFeaturedDestinations() {
  const dests = await getDestinations();
  return dests.filter(d => d.destacado);
}

/**
 * Carga todos los alojamientos.
 * @returns {Promise<Array>}
 */
export async function getAccommodations() {
  const data = await loadJSON('accommodations.json');
  return data.alojamientos || [];
}

/**
 * Carga todos los restaurantes.
 * @returns {Promise<Array>}
 */
export async function getRestaurants() {
  const data = await loadJSON('restaurants.json');
  return data.restaurantes || [];
}

/**
 * Obtiene TODOS los POIs del mapa (destinos + alojamientos + restaurantes).
 * Los normaliza en un formato común para el mapa.
 * @returns {Promise<Array>}
 */
export async function getAllPOIs() {
  const [dests, accomm, rests] = await Promise.all([
    getDestinations(),
    getAccommodations(),
    getRestaurants()
  ]);

  const pois = [
    ...dests.map(d => ({
      id: d.id,
      nombre: d.nombre,
      descripcionCorta: d.descripcionCorta,
      categoria: d.categoria,
      tipo: 'destino',
      coordenadas: d.coordenadas,
      imagenPrincipal: d.imagenPrincipal,
      precio: d.precio,
      rating: d.rating,
      _original: d
    })),
    ...accomm.map(a => ({
      id: a.id,
      nombre: a.nombre,
      descripcionCorta: a.descripcion,
      categoria: 'alojamiento',
      tipo: 'alojamiento',
      coordenadas: a.coordenadas,
      imagenPrincipal: a.imagenPrincipal,
      precio: typeof a.precio === 'object' ? `Desde $${a.precio.min?.toLocaleString('es-CL')}` : a.precio,
      rating: null,
      _original: a
    })),
    ...rests.map(r => ({
      id: r.id,
      nombre: r.nombre,
      descripcionCorta: r.descripcion,
      categoria: 'gastronomia',
      tipo: 'restaurante',
      coordenadas: r.coordenadas,
      imagenPrincipal: r.imagenPrincipal,
      precio: r.precio?.rango || '$',
      rating: null,
      _original: r
    }))
  ];

  return pois;
}

/**
 * Calcula la distancia en km entre dos coordenadas (fórmula Haversine).
 * @param {{lat, lng}} coord1
 * @param {{lat, lng}} coord2
 * @returns {number} km
 */
export function calcDistanceKm(coord1, coord2) {
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

/**
 * Ordena POIs por distancia desde una coordenada.
 * @param {Array} pois
 * @param {{lat, lng}} userCoord
 * @returns {Array} ordenados por distancia, con propiedad `distanciaKm`
 */
export function sortByDistance(pois, userCoord) {
  return pois
    .map(p => ({
      ...p,
      distanciaKm: calcDistanceKm(userCoord, p.coordenadas)
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

/**
 * Formatea distancia para mostrar al usuario.
 * @param {number} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (km < 0.1) return 'Aquí mismo';
  if (km < 1)   return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Formatea precio CLP.
 * @param {number} amount
 * @returns {string}
 */
export function formatPriceCLP(amount) {
  return `$${amount.toLocaleString('es-CL')}`;
}

/**
 * Obtiene el emoji de la categoría.
 * @param {string} categoria
 * @returns {string}
 */
export function getCategoryEmoji(categoria) {
  const map = {
    cultural:     '🎨',
    historico:    '🏛️',
    naturaleza:   '🌿',
    gastronomia:  '🍽️',
    patrimonio:   '🏺',
    entretencion: '🎉',
    alojamiento:  '🛏️',
    restaurante:  '🍴'
  };
  return map[categoria] || '📍';
}

/**
 * Obtiene la clase CSS de color por categoría.
 * @param {string} categoria
 * @returns {string}
 */
export function getCategoryColorClass(categoria) {
  const map = {
    cultural:     'sol',
    historico:    'tierra',
    naturaleza:   'verde',
    gastronomia:  'rojo',
    patrimonio:   'cielo',
    entretencion: 'rojo',
    alojamiento:  'cielo',
    restaurante:  'rojo'
  };
  return map[categoria] || 'gray';
}
