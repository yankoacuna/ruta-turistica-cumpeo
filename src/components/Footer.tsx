'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      <footer className="main-footer" role="contentinfo" id="section-info">
        <div className="container">
          <div className="footer-grid">
            {/* Columna 1: Marca & Municipio */}
            <div>
              <div className="footer-col-title">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="/assets/images/condorito-oficial.png"
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    alt="Condorito"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/condorito-oficial.png';
                    }}
                  />
                  Cumpeo Turismo
                </span>
              </div>
              <p className="footer-text mb-3">
                El Pueblo Temático de Condorito · Región del Maule.<br />
                Municipalidad de Río Claro. Guía turística interactiva con geolocalización GPS.
              </p>
              <div className="badge badge-rojo">¡Reflauta! Bienvenid@s</div>
            </div>

            {/* Columna 2: Info Útil */}
            <div>
              <div className="footer-col-title">
                <span>ℹ️ Info Útil del Visitante</span>
              </div>
              <div className="footer-item">
                <div className="footer-item-label">🚌 Cómo llegar</div>
                <div className="footer-item-value">Desde Talca: Ruta 5 Sur, ~50 km (45 min). Buses desde Terminal Rodoviario Talca.</div>
              </div>
              <div className="footer-item">
                <div className="footer-item-label">📅 Mejor época</div>
                <div className="footer-item-value">Octubre–Abril. Vendimia recomendada en Marzo–Abril.</div>
              </div>
              <div className="footer-item">
                <div className="footer-item-label">🌡️ Clima</div>
                <div className="footer-item-value">Mediterráneo. Veranos 25–34°C, Inviernos 4–14°C.</div>
              </div>
            </div>

            {/* Columna 3: Contacto & Emergencias */}
            <div>
              <div className="footer-col-title">
                <span>📞 Contacto & Emergencias</span>
              </div>
              <div className="mb-3">
                <div className="footer-item-label mb-2">🚨 Teléfonos de Emergencia</div>
                <div>
                  <span className="footer-emergency-pill">Carabineros: 133</span>
                  <span className="footer-emergency-pill">Bomberos: 132</span>
                  <span className="footer-emergency-pill">SAMU: 131</span>
                </div>
              </div>
              <div className="footer-item">
                <div className="footer-item-label">🏢 Municipalidad de Río Claro</div>
                <div className="footer-item-value">Teléfono: +56 71 254 1200</div>
                <div className="footer-item-value">Email: turismo@rioclaro.cl</div>
              </div>
            </div>

            {/* Columna 4: Enlaces Rápidos */}
            <div>
              <div className="footer-col-title">
                <span>🔗 Navegación</span>
              </div>
              <ul className="footer-links-list">
                <li><Link href="/">🏠 Inicio</Link></li>
                <li><Link href="/mapa">🗺️ Mapa Interactivo GPS</Link></li>
                <li><Link href="/#section-destinos">🎯 Destinos Turísticos</Link></li>
                <li><Link href="/#section-gastronomia">🍽️ Gastronomía Típica</Link></li>
                <li><Link href="/#section-alojamientos">🛏️ Alojamientos</Link></li>
                <li><Link href="/admin">⚙️ Administración</Link></li>
              </ul>
            </div>
          </div>

          {/* Bar inferior copyright */}
          <div className="footer-bottom-bar">
            <div>
              © 2026 <strong>Cumpeo Turismo</strong> · Municipalidad de Río Claro, Maule, Chile.
            </div>
            <div>
              v1.0.0 · Next.js Edition 🚀
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Navigation Bar ──────────────── */}
      <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
        <Link href="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <img src="/assets/images/condorito-oficial.png" className="bottom-nav-condorito-avatar" alt="Condorito" />
          <span>Inicio</span>
        </Link>
        <Link href="/mapa" className={`bottom-nav-item ${isActive('/mapa') ? 'active' : ''}`}>
          <span className="nav-icon">🗺️</span>
          <span>Mapa</span>
        </Link>
        <Link href="/#section-nearby" className="bottom-nav-item">
          <span className="nav-icon">📍</span>
          <span>Cercano</span>
        </Link>
        <Link href="/#section-info" className="bottom-nav-item">
          <span className="nav-icon">ℹ️</span>
          <span>Info</span>
        </Link>
      </nav>
    </>
  );
}
