/**
 * app.js — Cumpeo Turismo
 * Módulo principal: inicialización, estado global y utilidades compartidas
 */

// ── Estado Global ──────────────────────────────────────────
export const AppState = {
  userPosition: null,
  config:       null,
  initialized:  false
};

// ── Inicialización de la App ───────────────────────────────
export async function initApp() {
  if (AppState.initialized) return;
  AppState.initialized = true;

  // Marcar página activa en bottom nav
  markActiveNav();

  // Escuchar cambios de visibilidad (para actualizar datos)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // La página recuperó foco (por ejemplo, el usuario volvió de Google Maps)
      console.log('[App] Página recuperó foco');
    }
  });

  console.log('[App] Inicializado — Cumpeo Turismo v1.0.0');
}

// ── Mobile Drawer Toggle & Share ─────────────────────────────
window.toggleMobileDrawer = function() {
  const drawer = document.getElementById('mobile-drawer-overlay');
  if (drawer) {
    const isActive = drawer.classList.toggle('active');
    document.body.style.overflow = isActive ? 'hidden' : '';
  }
};

window.closeMobileDrawer = function() {
  const drawer = document.getElementById('mobile-drawer-overlay');
  if (drawer) {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.shareApp = async function() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Cumpeo Turismo — El Pueblo de Condorito',
        text: '¡Descubre Cumpeo, el único pueblo temático de Condorito en la Región del Maule, Chile!',
        url: window.location.href
      });
    } catch (err) {
      console.log('Compartir cancelado');
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    } catch(e) {
      alert('Copia este enlace: ' + window.location.href);
    }
  }
};

// ── Bottom Nav: resaltar ítem activo ─────────────────────
function markActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navMap = {
    'index.html':   'nav-home',
    '':             'nav-home',
    'mapa.html':    'nav-map',
    'destino.html': 'nav-home',
    'admin.html':   null
  };
  const activeId = navMap[currentPage];
  if (activeId) {
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.id === activeId);
      if (el.id === activeId) el.setAttribute('aria-current', 'page');
    });
  }
  
  // Highlight active link in desktop menu
  document.querySelectorAll('.nav-link-item').forEach(el => {
    const href = el.getAttribute('href');
    if (href && (href === currentPage || (currentPage === '' && href === 'index.html'))) {
      el.classList.add('active');
    }
  });
}

// ── Utilidades globales ───────────────────────────────────

/**
 * Previene doble-tap zoom en iOS para botones.
 * Importante para una UX fluida en dispositivos móviles.
 */
export function preventDoubleTapZoom() {
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300 && e.target.tagName === 'BUTTON') {
      e.preventDefault();
    }
    lastTap = now;
  }, { passive: false });
}

/**
 * Detecta si la app está ejecutándose como PWA instalada.
 * @returns {boolean}
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

/**
 * Solicita instalar la PWA (beforeinstallprompt).
 */
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredPrompt = e;
  // Mostrar banner de instalación solo si no es ya PWA
  if (!isPWA()) {
    showInstallBanner();
  }
});

function showInstallBanner() {
  // Solo mostrar si el usuario no lo ha descartado antes
  if (localStorage.getItem('pwa_dismissed')) return;

  const banner = document.createElement('div');
  banner.className = 'pwa-banner';
  banner.id = 'pwa-banner';
  banner.innerHTML = `
    <div class="pwa-banner-icon">📱</div>
    <div style="flex:1">
      <div style="font-size:var(--text-sm);font-weight:700;color:var(--color-text-primary)">Instalar App</div>
      <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">Accede sin internet a los destinos</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      <button class="btn btn-primary btn-sm" onclick="installPWA()" aria-label="Instalar aplicación">Instalar</button>
      <button class="btn btn-ghost btn-sm" onclick="dismissBanner()" aria-label="Cerrar">No gracias</button>
    </div>`;
  document.body.appendChild(banner);
}

window.installPWA = async function() {
  if (!_deferredPrompt) return;
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  document.getElementById('pwa-banner')?.remove();
  if (outcome === 'accepted') {
    console.log('[PWA] Usuario instaló la app');
  }
};

window.dismissBanner = function() {
  localStorage.setItem('pwa_dismissed', '1');
  document.getElementById('pwa-banner')?.remove();
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
