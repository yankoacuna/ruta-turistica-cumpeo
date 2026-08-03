'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [weather, setWeather] = useState<{temp: number, icon: string} | null>(null);

  useEffect(() => {
    // Fetch clima real de Cumpeo usando Open-Meteo (Sin API Key)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-35.3456&longitude=-71.4123&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (data && data.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          // Mapeo básico de códigos WMO a emojis
          let icon = '☁️';
          if (code === 0 || code === 1) icon = '☀️';
          else if (code === 2 || code === 3) icon = '⛅';
          else if (code >= 60 && code <= 69) icon = '🌧️';
          
          setWeather({ temp, icon });
        }
      })
      .catch(err => console.error("Error al obtener clima:", err));
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* ── DESKTOP TOP NAV ─────── */}
      <nav className="desktop-nav" role="navigation" aria-label="Navegación desktop">
        <div className="desktop-nav-container">
          {/* Brand Logo Condorito */}
          <Link href="/" className="brand-logo-link" title="Inicio Cumpeo Turismo">
            <div className="condorito-avatar-badge">
              <img
                src="/assets/images/condorito-oficial.png"
                alt="Condorito Logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/condorito-oficial.png';
                }}
              />
            </div>
            <div className="brand-text-block">
              <div className="brand-main-title">Cumpeo Turismo</div>
              <div className="brand-sub-title">
                <span>El Pueblo de Condorito</span>
                <span className="condorito-tag-pill">¡PLOP!</span>
              </div>
            </div>
          </Link>

          {/* Navigation Menu Links */}
          <div className="desktop-nav-menu">
            <Link href="/" className={`nav-link-item ${isActive('/') ? 'active' : ''}`}>
              <span className="nav-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11L12 3L21 11V20C21 20.6 20.6 21 20 21H15V16H9V21H4C3.4 21 3 20.6 3 20V11Z" fill="#FFD60A" stroke="#1E1E24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="9" y="15.5" width="6" height="5.5" rx="1" fill="#E63946" stroke="#1E1E24" strokeWidth="1.8"/>
                </svg>
              </span>
              Inicio
            </Link>

            <Link href="/historia" className={`nav-link-item ${isActive('/historia') ? 'active' : ''}`}>
              <span className="nav-icon" style={{ fontSize: '1.2rem' }}>📜</span>
              Historia
            </Link>

            <Link href="/#section-destinos" className="nav-link-item">
              <span className="nav-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9.5" fill="#8338EC" stroke="#1E1E24" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="5.5" fill="#FFD60A" stroke="#1E1E24" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2.3" fill="#E63946" stroke="#1E1E24" strokeWidth="1.5"/>
                </svg>
              </span>
              Destino
            </Link>

            <Link href="/contacto" className={`nav-link-item ${isActive('/contacto') ? 'active' : ''}`}>
              <span className="nav-icon" style={{ fontSize: '1.2rem' }}>📞</span>
              Contactanos
            </Link>
          </div>

          {/* Actions / CTAs */}
          <div className="desktop-nav-cta">
            <div className="weather-pill" title="Clima actual en Cumpeo">
              {weather ? `${weather.icon} ${weather.temp}°C Cumpeo` : 'Cargando clima...'}
            </div>
            <Link href="/mapa" className="btn-nav-map" title="Abrir Mapa GPS de Condorito">
              <span>🗺️</span> Abrir Mapa GPS
            </Link>
            <Link href="/admin" className="btn-nav-icon" title="Panel Admin" aria-label="Admin">
              ⚙️
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE HEADER BAR ─────── */}
      <header className="app-header" role="banner" style={{ display: 'none' }}>
        <Link href="/" className="brand-logo-link" style={{ gap: '8px' }}>
          <div className="condorito-avatar-badge" style={{ width: '40px', height: '40px' }}>
            <img src="/assets/images/condorito-oficial.png" alt="Condorito Logo" />
          </div>
          <div className="brand-text-block">
            <div className="brand-main-title" style={{ fontSize: '1.15rem' }}>Cumpeo Turismo</div>
            <div className="brand-sub-title" style={{ fontSize: '0.72rem' }}>El Pueblo de Condorito</div>
          </div>
        </Link>
        <button className="mobile-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
          ☰ Menú
        </button>
      </header>

      {/* ── MOBILE SLIDE-OVER DRAWER MENU ─────── */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay active" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="condorito-avatar-badge" style={{ width: '42px', height: '42px' }}>
                  <img src="/assets/images/condorito-oficial.png" alt="Condorito" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-sol)' }}>
                    Cumpeo Turismo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#D1D5DB', fontWeight: 600 }}>Pelotillehue Real</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.6rem', cursor: 'pointer', padding: '4px' }}
              >
                &times;
              </button>
            </div>

            <div className="drawer-body">
              <div style={{ padding: '0 16px 16px' }}>
                <div className="weather-pill" style={{ width: '100%', justifyContent: 'center' }}>
                  {weather ? `${weather.icon} ${weather.temp}°C Cumpeo` : 'Cargando clima...'}
                </div>
              </div>
              <Link href="/" className={`drawer-nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>🏠</span> Inicio
              </Link>
              <Link href="/historia" className={`drawer-nav-item ${isActive('/historia') ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>📜</span> Historia
              </Link>
              <Link href="/#section-destinos" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>🎯</span> Destino
              </Link>
              <Link href="/contacto" className={`drawer-nav-item ${isActive('/contacto') ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>📞</span> Contactanos
              </Link>
              <Link href="/admin" className={`drawer-nav-item ${isActive('/admin') ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>⚙️</span> Panel de Administración
              </Link>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href="/mapa" className="btn-nav-map" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setDrawerOpen(false)}>
                  🗺️ Abrir Mapa GPS
                </Link>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  <em>&quot;¡Exijo una explicación! — Ven a Cumpeo&quot;</em> 🚩
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
