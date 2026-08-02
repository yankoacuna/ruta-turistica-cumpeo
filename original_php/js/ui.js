/**
 * ui.js — Cumpeo Turismo
 * Renderizadores de componentes y helpers de UI
 */

import { getCategoryEmoji, getCategoryColorClass, formatDistance, formatPriceCLP } from './data.js';

// ── Renderizadores de Cards ────────────────────────────────

/**
 * Genera HTML de una card de destino vertical (grande).
 * @param {Object} dest - objeto destino/POI
 * @param {number|null} distanciaKm
 * @returns {string} HTML
 */
export function renderDestinationCard(dest, distanciaKm = null) {
  const emoji    = getCategoryEmoji(dest.categoria);
  const color    = getCategoryColorClass(dest.categoria);
  const distText = distanciaKm !== null ? formatDistance(distanciaKm) : null;
  const stars    = dest.rating ? renderStars(dest.rating) : '';

  return `
    <article class="destination-card ${dest.destacado ? 'featured' : ''} animate-fade-in-up"
             data-id="${dest.id}"
             role="button"
             tabindex="0"
             aria-label="Ver detalles de ${dest.nombre}"
             onclick="navigateTo('destino.html?id=${dest.id}')">
      <div class="card-img-wrap">
        <div class="card-img-skeleton">${emoji}</div>
        ${dest.imagenPrincipal
          ? `<img class="card-img" src="${dest.imagenPrincipal}" alt="${dest.nombre}" loading="lazy" onerror="this.style.display='none'">`
          : ''}
        <div class="card-badge-top">
          <span class="badge badge-${color}">${emoji} ${dest.categoria}</span>
        </div>
        <button class="card-fav-btn" onclick="event.stopPropagation(); toggleFav('${dest.id}', this)"
                aria-label="Guardar en favoritos">♡</button>
      </div>
      <div class="card-body">
        <div class="card-category">${emoji} ${dest.categoria.charAt(0).toUpperCase() + dest.categoria.slice(1)}</div>
        <h3 class="card-title">${dest.nombre}</h3>
        <p class="card-desc line-clamp-2">${dest.descripcionCorta}</p>
        <div class="card-footer">
          <div class="card-meta">
            ${distText ? `<span>📍 ${distText}</span>` : ''}
            ${dest.precio ? `<span>· ${dest.precio}</span>` : ''}
          </div>
          ${stars ? `<div class="card-rating">⭐ ${dest.rating.toFixed(1)}</div>` : ''}
        </div>
      </div>
    </article>`;
}

/**
 * Genera HTML de una card horizontal compacta.
 * @param {Object} item
 * @param {number|null} distanciaKm
 * @returns {string}
 */
export function renderCardHorizontal(item, distanciaKm = null) {
  const emoji  = getCategoryEmoji(item.categoria);
  const color  = getCategoryColorClass(item.categoria);
  const dist   = distanciaKm !== null ? `📍 ${formatDistance(distanciaKm)}` : '';

  return `
    <article class="card-horizontal"
             data-id="${item.id}"
             role="button" tabindex="0"
             onclick="navigateTo('destino.html?id=${item.id}')"
             aria-label="${item.nombre}">
      <div style="width:130px;min-width:130px;min-height:110px;background:var(--color-surface-soft);display:flex;align-items:center;justify-content:center;font-size:2rem;position:relative;overflow:hidden;flex-shrink:0;">
        ${item.imagenPrincipal
          ? `<img class="card-h-img" src="${item.imagenPrincipal}" alt="${item.nombre}" loading="lazy" onerror="this.style.display='none'">` 
          : emoji}
      </div>
      <div class="card-h-body">
        <span class="badge badge-${color}" style="font-size:0.6rem;padding:2px 8px;margin-bottom:4px;align-self:flex-start">${emoji} ${item.categoria}</span>
        <div class="card-h-title">${item.nombre}</div>
        <div class="card-h-subtitle line-clamp-2">${item.descripcionCorta || ''}</div>
        <div class="card-h-meta">
          ${dist ? `<span class="text-muted" style="font-size:0.7rem">${dist}</span>` : ''}
          ${item.precio ? `<span class="text-muted" style="font-size:0.7rem">· ${item.precio}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;align-items:center;padding:0 var(--space-3)">
        <span style="color:var(--color-text-muted);font-size:18px">›</span>
      </div>
    </article>`;
}

/**
 * Genera HTML de card compacta (para scroll horizontal).
 * @param {Object} item
 * @returns {string}
 */
export function renderCardCompact(item) {
  const emoji = getCategoryEmoji(item.categoria);
  const color = getCategoryColorClass(item.categoria);

  return `
    <article class="card-compact"
             role="button" tabindex="0"
             onclick="navigateTo('destino.html?id=${item.id}')"
             aria-label="${item.nombre}">
      <div class="card-img-wrap">
        <div class="card-img-skeleton">${emoji}</div>
        ${item.imagenPrincipal
          ? `<img class="card-img" src="${item.imagenPrincipal}" alt="${item.nombre}" loading="lazy" onerror="this.style.display='none'">` 
          : ''}
        <div class="card-badge-top">
          <span class="badge badge-${color}" style="font-size:0.55rem;padding:2px 6px">${emoji}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${item.nombre}</div>
        ${item.precio ? `<div class="text-muted text-xs">${item.precio}</div>` : ''}
      </div>
    </article>`;
}

// ── Renderizadores de Secciones ────────────────────────────

/**
 * Renderiza la grilla de categorías.
 * @param {Array} categorias
 * @param {Function} onSelect - callback(categoriaId)
 * @returns {string}
 */
export function renderCategories(categorias) {
  return categorias.map(cat => `
    <div class="category-item"
         role="button" tabindex="0"
         data-categoria="${cat.id}"
         onclick="filterByCategory('${cat.id}')"
         aria-label="Filtrar por ${cat.nombre}">
      <div class="category-emoji">${cat.emoji}</div>
      <div class="category-name">${cat.nombre}</div>
    </div>
  `).join('');
}

/**
 * Renderiza chips de filtro para el mapa.
 * @param {Array} categorias
 * @param {string} activeId
 * @returns {string}
 */
export function renderFilterChips(categorias, activeId = 'todos') {
  const all = [{ id: 'todos', nombre: 'Todos', emoji: '🗺️' }, ...categorias];
  return all.map(cat => `
    <button class="chip ${cat.id === activeId ? 'active' : ''}"
            data-categoria="${cat.id}"
            onclick="setMapFilter('${cat.id}', this)"
            aria-pressed="${cat.id === activeId}">
      <span class="chip-emoji">${cat.emoji}</span>
      ${cat.nombre}
    </button>
  `).join('');
}

/**
 * Renderiza info de un POI en el mini panel del mapa.
 * @param {Object} poi
 * @param {number|null} distanciaKm
 * @returns {string}
 */
export function renderPoiMiniPanel(poi, distanciaKm = null) {
  const emoji = getCategoryEmoji(poi.categoria);
  const dist  = distanciaKm !== null ? formatDistance(distanciaKm) : '';

  return `
    <div class="poi-mini-content">
      <div style="width:80px;min-width:80px;background:var(--color-surface);display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:var(--color-text-muted)">
        ${poi.imagenPrincipal
          ? `<img class="poi-mini-img" src="${poi.imagenPrincipal}" alt="${poi.nombre}" onerror="this.parentNode.textContent='${emoji}'">`
          : emoji}
      </div>
      <div class="poi-mini-info">
        <div class="poi-mini-cat">${emoji} ${poi.categoria}</div>
        <div class="poi-mini-name">${poi.nombre}</div>
        ${dist ? `<div class="poi-mini-dist">📍 ${dist}</div>` : ''}
      </div>
      <div class="poi-mini-actions">
        <button class="poi-mini-btn poi-mini-btn-nav"
                onclick="startNavigation('${poi.id}')"
                title="Cómo llegar">🧭</button>
        <button class="poi-mini-btn poi-mini-btn-info"
                onclick="navigateTo('destino.html?id=${poi.id}')"
                title="Ver detalles">ℹ️</button>
      </div>
    </div>`;
}

// ── Amenidades ─────────────────────────────────────────────

/**
 * Renderiza lista de amenidades.
 * @param {Object} infoUtil
 * @returns {string}
 */
export function renderAmenities(infoUtil) {
  const items = [
    { key: 'estacionamiento',  label: 'Estacionamiento', icon: '🚗' },
    { key: 'accesoSillaRuedas',label: 'Acceso universal', icon: '🦽' },
    { key: 'aptoFamilias',     label: 'Apto familias',  icon: '👨‍👩‍👧‍👦' },
    { key: 'mascotas',         label: 'Mascotas ok',    icon: '🐾' },
    { key: 'wifi',             label: 'WiFi',           icon: '📡' },
    { key: 'banos',            label: 'Baños',          icon: '🚿' }
  ];

  // Solo mostramos los servicios activos
  const activeItems = items.filter(it => infoUtil[it.key]);

  if (!activeItems.length) return '';

  return `
    <div class="amenities-grid">
      ${activeItems.map(it => `
        <div class="amenity-item active">
          <span class="amenity-icon">${it.icon}</span>
          <span>${it.label}</span>
        </div>
      `).join('')}
    </div>`;
}

// ── Stars ──────────────────────────────────────────────────

/**
 * Genera HTML de estrellas de rating (máx 5).
 * @param {number} rating
 * @returns {string}
 */
export function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf   = (rating % 1) >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return `
    <div class="stars" aria-label="Rating: ${rating} de 5 estrellas">
      ${'<span class="star filled">★</span>'.repeat(fullStars)}
      ${hasHalf ? '<span class="star half">★</span>' : ''}
      ${'<span class="star">★</span>'.repeat(emptyStars)}
    </div>`;
}

// ── Info Rows ──────────────────────────────────────────────

/**
 * Genera una info row (ícono + label + valor).
 */
export function renderInfoRow(icon, label, value) {
  if (!value) return '';
  return `
    <div class="info-row">
      <div class="info-row-icon">${icon}</div>
      <div class="info-row-content">
        <div class="info-row-label">${label}</div>
        <div class="info-row-value">${value}</div>
      </div>
    </div>`;
}

// ── Toast Notifications ────────────────────────────────────

let _toastTimer = null;

/**
 * Muestra una notificación tipo toast.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Bottom Sheet ───────────────────────────────────────────

/**
 * Muestra u oculta el bottom sheet.
 * @param {boolean} visible
 */
export function toggleBottomSheet(visible) {
  const sheet   = document.getElementById('bottom-sheet');
  const overlay = document.getElementById('bottom-sheet-overlay');
  if (!sheet || !overlay) return;
  sheet.classList.toggle('active', visible);
  overlay.classList.toggle('active', visible);
  document.body.style.overflow = visible ? 'hidden' : '';
}

// ── Skeleton Loaders ───────────────────────────────────────

/**
 * Genera N skeletons de cards.
 * @param {number} n
 * @returns {string}
 */
export function renderSkeletons(n = 3) {
  return Array.from({ length: n }, () => `
    <div class="destination-card" style="pointer-events:none">
      <div class="card-img-wrap skeleton" style="aspect-ratio:16/9"></div>
      <div class="card-body" style="gap:var(--space-3)">
        <div class="skeleton" style="height:12px;width:60%;border-radius:4px"></div>
        <div class="skeleton" style="height:18px;width:90%;border-radius:4px"></div>
        <div class="skeleton" style="height:14px;width:100%;border-radius:4px"></div>
        <div class="skeleton" style="height:14px;width:75%;border-radius:4px"></div>
      </div>
    </div>
  `).join('');
}

// ── Favoritos ──────────────────────────────────────────────

/**
 * Toggle de favorito (LocalStorage).
 * @param {string} id
 * @param {HTMLElement|null} btn
 */
export function toggleFav(id, btn = null) {
  const favs = getFavs();
  const idx  = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
    if (btn) { btn.textContent = '♥'; btn.classList.add('active'); }
    showToast('Guardado en favoritos', 'success', 2000);
  } else {
    favs.splice(idx, 1);
    if (btn) { btn.textContent = '♡'; btn.classList.remove('active'); }
    showToast('Eliminado de favoritos', 'info', 2000);
  }
  localStorage.setItem('cumpeo_favs', JSON.stringify(favs));
}

export function getFavs() {
  try { return JSON.parse(localStorage.getItem('cumpeo_favs') || '[]'); }
  catch { return []; }
}

export function isFav(id) { return getFavs().includes(id); }

// ── Navegación ─────────────────────────────────────────────

/**
 * Navega a una URL (SPA-like dentro de la misma app).
 * @param {string} url
 */
export function navigateTo(url) {
  window.location.href = url;
}
