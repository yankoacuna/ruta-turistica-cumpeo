/**
 * map.js — Cumpeo Turismo
 * Módulo del Mapa Interactivo Google Maps + Geolocalización GPS + Ruteo
 * 
 * Requiere: Google Maps JavaScript API con bibliotecas: places, geometry
 */

import { getAllPOIs, getConfig, sortByDistance, formatDistance, getCategoryEmoji } from './data.js';
import { renderPoiMiniPanel, renderFilterChips, showToast } from './ui.js';

// ── Estado del Módulo ─────────────────────────────────────
const state = {
  map:           null,      // instancia de google.maps.Map
  markers:       [],        // array de objetos { poi, marker }
  activeFilter:  'todos',   // categoría activa
  userPosition:  null,      // { lat, lng } del usuario
  userMarker:    null,      // marcador del usuario en el mapa
  watchId:       null,      // ID del watchPosition GPS
  directionsRenderer: null, // renderizador de rutas
  directionsService:  null, // servicio de rutas
  activePoi:     null,      // POI seleccionado actualmente
  config:        null,      // configuración global
  allPois:       []         // todos los POIs cargados
};

// ── Estilo oscuro del mapa (inspirado en el cielo nocturno del Maule) ──
const MAP_DARK_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',stylers: [{ color: '#a89f8c' }] },
  { elementType: 'labels.text.stroke',stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'water',           elementType: 'geometry', stylers: [{ color: '#1A4D72' }] },
  { featureType: 'water',           elementType: 'labels.text.fill', stylers: [{ color: '#4A8EBF' }] },
  { featureType: 'road',            elementType: 'geometry', stylers: [{ color: '#2E2E50' }] },
  { featureType: 'road',            elementType: 'geometry.stroke', stylers: [{ color: '#252540' }] },
  { featureType: 'road.highway',    elementType: 'geometry', stylers: [{ color: '#8B5E3C' }] },
  { featureType: 'road.highway',    elementType: 'geometry.stroke', stylers: [{ color: '#5C3A20' }] },
  { featureType: 'road.highway',    elementType: 'labels.text.fill', stylers: [{ color: '#E8A020' }] },
  { featureType: 'poi',             elementType: 'geometry', stylers: [{ color: '#2E2E50' }] },
  { featureType: 'poi.park',        elementType: 'geometry', stylers: [{ color: '#2F5238' }] },
  { featureType: 'poi.park',        elementType: 'labels.text.fill', stylers: [{ color: '#6BA07B' }] },
  { featureType: 'landscape',       elementType: 'geometry', stylers: [{ color: '#252540' }] },
  { featureType: 'administrative',  elementType: 'geometry.stroke', stylers: [{ color: '#4A7C59' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#E8A020' }] },
  { featureType: 'transit',         elementType: 'geometry', stylers: [{ color: '#2E2E50' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#a89f8c' }] }
];

// ── Colores de marcadores por categoría ────────────────────
const MARKER_COLORS = {
  cultural:     '#E8A020',
  historico:    '#8B5E3C',
  naturaleza:   '#4A7C59',
  gastronomia:  '#C0392B',
  patrimonio:   '#2C6E9E',
  entretencion: '#9B59B6',
  alojamiento:  '#9B59B6',
  todos:        '#F5EED8'
};

// ── Inicialización Principal ───────────────────────────────

/**
 * Inicializa el mapa. Llamado como callback de la API de Google Maps.
 * Se expone en window para que Google Maps la invoque como callback.
 */
export async function initMap() {
  try {
    state.config = await getConfig();
    const center = state.config.mapa.centroDefault;

    // Crear el mapa
    state.map = new google.maps.Map(document.getElementById('map'), {
      center,
      zoom:              state.config.mapa.zoomDefault,
      styles:            MAP_DARK_STYLE,
      disableDefaultUI:  true,
      gestureHandling:   'greedy',
      clickableIcons:    false,
      mapTypeControl:    false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl:       false
    });

    // Inicializar servicios de Directions
    state.directionsService  = new google.maps.DirectionsService();
    state.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers:        true,
      polylineOptions: {
        strokeColor:   '#8B5E3C',
        strokeWeight:  5,
        strokeOpacity: 0.9
      }
    });
    state.directionsRenderer.setMap(state.map);

    // Cargar POIs y marcadores
    await loadAndRenderMarkers();

    // Inicializar filtros en la UI
    initFilters();

    // Solicitar GPS automáticamente
    requestGPS();

    // Click en el mapa → cerrar panel activo
    state.map.addListener('click', () => closeMiniPanel());

    console.log('[Map] Inicializado correctamente');
  } catch (err) {
    console.error('[Map] Error inicializando:', err);
    showMapError(err.message);
  }
}

// ── Carga de Marcadores ────────────────────────────────────

async function loadAndRenderMarkers() {
  state.allPois = await getAllPOIs();
  renderMarkers(state.allPois);
}

/**
 * Renderiza marcadores en el mapa para los POIs dados.
 * @param {Array} pois
 */
function renderMarkers(pois) {
  // Limpiar marcadores existentes
  state.markers.forEach(({ marker }) => marker.setMap(null));
  state.markers = [];

  pois.forEach(poi => {
    if (!poi.coordenadas?.lat || !poi.coordenadas?.lng) return;

    const color = MARKER_COLORS[poi.categoria] || MARKER_COLORS.todos;
    const emoji  = getCategoryEmoji(poi.categoria);

    // Usar SVG personalizado como icono del marcador
    const svgMarker = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z',
      fillColor:    color,
      fillOpacity:  1,
      strokeWeight: 1.5,
      strokeColor:  'rgba(255,255,255,0.4)',
      scale:        1.8,
      anchor:       new google.maps.Point(12, 22),
      labelOrigin:  new google.maps.Point(12, 9)
    };

    const marker = new google.maps.Marker({
      position:  { lat: poi.coordenadas.lat, lng: poi.coordenadas.lng },
      map:       state.map,
      icon:      svgMarker,
      title:     poi.nombre,
      animation: google.maps.Animation.DROP
    });

    // Click en marcador → mostrar mini panel
    marker.addListener('click', () => {
      selectPoi(poi, marker);
    });

    state.markers.push({ poi, marker });
  });
}

// ── Selección de POI ───────────────────────────────────────

/**
 * Selecciona un POI y muestra el mini panel.
 * @param {Object} poi
 * @param {google.maps.Marker} marker
 */
function selectPoi(poi, marker) {
  state.activePoi = poi;

  // Animar el marcador seleccionado
  state.markers.forEach(({ marker: m }) => {
    m.setAnimation(null);
    m.setZIndex(1);
  });
  marker.setAnimation(google.maps.Animation.BOUNCE);
  marker.setZIndex(100);
  setTimeout(() => marker.setAnimation(null), 1500);

  // Centrar mapa suavemente
  state.map.panTo({ lat: poi.coordenadas.lat, lng: poi.coordenadas.lng });
  state.map.panBy(0, -80); // desplazar hacia arriba para ver el panel

  // Calcular distancia desde el usuario
  const distKm = state.userPosition
    ? calcDistanceKm(state.userPosition, poi.coordenadas)
    : null;

  // Actualizar mini panel
  const panel = document.getElementById('poi-mini-panel');
  if (panel) {
    panel.innerHTML = renderPoiMiniPanel(poi, distKm);
    panel.classList.add('active');
  }
}

function closeMiniPanel() {
  state.activePoi = null;
  const panel = document.getElementById('poi-mini-panel');
  if (panel) panel.classList.remove('active');
  state.directionsRenderer.setDirections({ routes: [] });
}

// ── Filtros ────────────────────────────────────────────────

function initFilters() {
  // Los chips ya se renderizan desde mapa.html, solo bindear el estado
}

/**
 * Aplica filtro por categoría en el mapa.
 * @param {string} categoriaId
 * @param {HTMLElement} chipEl
 */
window.setMapFilter = function(categoriaId, chipEl) {
  state.activeFilter = categoriaId;

  // Actualizar chips UI
  document.querySelectorAll('.map-filters-scroll .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.categoria === categoriaId);
    c.setAttribute('aria-pressed', c.dataset.categoria === categoriaId);
  });

  // Filtrar POIs
  const filtered = categoriaId === 'todos'
    ? state.allPois
    : state.allPois.filter(p => p.categoria === categoriaId || p.tipo === categoriaId);

  closeMiniPanel();
  renderMarkers(filtered);
};

// ── GPS / Geolocalización ──────────────────────────────────

/**
 * Solicita acceso a la ubicación del usuario via API de Geolocalización.
 * Muestra el estado en la UI durante la solicitud.
 */
function requestGPS() {
  if (!navigator.geolocation) {
    showToast('Tu navegador no soporta GPS', 'error');
    return;
  }
  updateGPSBtn('locating');
  showMapStatus('Obteniendo tu ubicación…');

  // watchPosition: se actualiza en tiempo real mientras el usuario se mueve
  state.watchId = navigator.geolocation.watchPosition(
    onGPSSuccess,
    onGPSError,
    {
      enableHighAccuracy: true,
      maximumAge:         10000,
      timeout:            20000
    }
  );
}

/**
 * Callback de éxito de GPS.
 * @param {GeolocationPosition} position
 */
function onGPSSuccess(position) {
  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  state.userPosition = { lat, lng };

  // Crear o actualizar marcador del usuario
  if (!state.userMarker) {
    state.userMarker = new google.maps.Marker({
      position:  { lat, lng },
      map:       state.map,
      title:     'Tu ubicación',
      zIndex:    999,
      icon: {
        path:         google.maps.SymbolPath.CIRCLE,
        fillColor:    '#4A90E2',
        fillOpacity:  1,
        strokeColor:  'white',
        strokeWeight: 3,
        scale:        10
      }
    });

    // Centrar el mapa en el usuario la primera vez
    state.map.panTo({ lat, lng });
    state.map.setZoom(state.config.mapa.zoomDefault);
    showToast(`📍 Ubicación encontrada (±${Math.round(accuracy)}m)`, 'success', 3000);
  } else {
    state.userMarker.setPosition({ lat, lng });
  }

  updateGPSBtn('located');
  hideMapStatus();
}

/**
 * Callback de error de GPS.
 * @param {GeolocationPositionError} err
 */
function onGPSError(err) {
  updateGPSBtn('idle');
  hideMapStatus();

  const messages = {
    1: 'Permiso GPS denegado. Actívalo en Configuración del navegador.',
    2: 'No se pudo obtener la posición. Verifica tu señal.',
    3: 'La solicitud de GPS expiró. Intenta de nuevo.'
  };
  showToast(messages[err.code] || 'Error GPS desconocido', 'error', 5000);
  console.warn('[GPS] Error:', err.code, err.message);
}

/**
 * Centra el mapa en la ubicación del usuario.
 */
window.centerOnUser = function() {
  if (state.userPosition) {
    state.map.panTo(state.userPosition);
    state.map.setZoom(16);
  } else {
    requestGPS();
  }
};

// ── Navegación / Ruteo ─────────────────────────────────────

/**
 * Calcula y muestra la ruta desde el usuario hasta un POI.
 * @param {string} poiId
 */
window.startNavigation = async function(poiId) {
  const poi = state.allPois.find(p => p.id === poiId) || state.activePoi;
  if (!poi) return;

  // Si no tenemos ubicación del usuario, pedirla primero
  if (!state.userPosition) {
    showToast('Activa el GPS para obtener una ruta', 'info');
    requestGPS();
    return;
  }

  showMapStatus('Calculando ruta…');

  const request = {
    origin:      new google.maps.LatLng(state.userPosition.lat, state.userPosition.lng),
    destination: new google.maps.LatLng(poi.coordenadas.lat, poi.coordenadas.lng),
    travelMode:  google.maps.TravelMode.WALKING  // Walking para rutas cortas en pueblo
  };

  try {
    const result = await new Promise((resolve, reject) => {
      state.directionsService.route(request, (res, status) => {
        if (status === google.maps.DirectionsStatus.OK) resolve(res);
        else reject(new Error(status));
      });
    });

    state.directionsRenderer.setDirections(result);

    const leg = result.routes[0].legs[0];
    hideMapStatus();
    showDirectionsPanel(poi.nombre, leg.duration.text, leg.distance.text);
    showToast(`🚶 ${leg.duration.text} caminando (${leg.distance.text})`, 'success', 4000);

    // Ajustar el zoom para ver toda la ruta
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(state.userPosition);
    bounds.extend({ lat: poi.coordenadas.lat, lng: poi.coordenadas.lng });
    state.map.fitBounds(bounds, { padding: 60 });

  } catch (err) {
    hideMapStatus();
    console.error('[Directions] Error:', err);
    // Fallback: abrir Google Maps nativo
    openGoogleMapsNavigation(poi);
  }
};

/**
 * Abre Google Maps nativo para navegar.
 * @param {Object} poi
 */
function openGoogleMapsNavigation(poi) {
  const origin = state.userPosition
    ? `${state.userPosition.lat},${state.userPosition.lng}`
    : 'Cumpeo,Chile';
  const dest   = `${poi.coordenadas.lat},${poi.coordenadas.lng}`;
  const url    = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`;
  window.open(url, '_blank');
}

// ── Helpers de UI del mapa ─────────────────────────────────

function updateGPSBtn(status) {
  const btn = document.getElementById('btn-gps');
  if (!btn) return;
  btn.classList.toggle('locating', status === 'locating');
  btn.classList.toggle('located',  status === 'located');
  const icons = { idle: '📍', locating: '🔄', located: '📍' };
  btn.textContent = icons[status] || '📍';
}

function showMapStatus(text) {
  const el = document.getElementById('map-status');
  if (!el) return;
  el.querySelector('.map-status-text').textContent = text;
  el.classList.add('visible');
  el.classList.remove('success', 'error');
}

function hideMapStatus() {
  const el = document.getElementById('map-status');
  if (el) el.classList.remove('visible');
}

function showDirectionsPanel(destName, duration, distance) {
  const panel = document.getElementById('directions-panel');
  if (!panel) return;
  panel.querySelector('.directions-dest').textContent = `→ ${destName}`;
  panel.querySelector('.directions-meta').textContent = `🚶 ${duration} · ${distance}`;
  panel.classList.add('active');
}

function showMapError(msg) {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;
  mapEl.innerHTML = `
    <div class="map-error-state">
      <div class="map-error-icon">🗺️</div>
      <h3>Mapa no disponible</h3>
      <p>${msg || 'Verifica tu conexión o recarga la página.'}</p>
      <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
    </div>`;
}

// ── Utilidades ─────────────────────────────────────────────

/**
 * Haversine distance.
 */
function calcDistanceKm(coord1, coord2) {
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(coord1.lat))*Math.cos(toRad(coord2.lat))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function toRad(deg) { return deg * (Math.PI/180); }

// ── Control de Zoom ────────────────────────────────────────
window.mapZoomIn  = () => state.map && state.map.setZoom(state.map.getZoom() + 1);
window.mapZoomOut = () => state.map && state.map.setZoom(state.map.getZoom() - 1);

// ── Limpieza ───────────────────────────────────────────────

/**
 * Detiene el seguimiento GPS. Llamar al salir de la página.
 */
export function stopGPS() {
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
}

// Exponer initMap para Google Maps callback
window.initMap = initMap;
