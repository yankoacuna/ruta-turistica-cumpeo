'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      <footer className="bg-[#1E1E24] text-gray-300 py-8 md:py-12" role="contentinfo" id="section-info">
        <div className="w-full max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Columna 1: Marca & Municipio */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span className="inline-flex items-center gap-2">
                  <img
                    src="/assets/images/condorito-oficial.png"
                    className="w-6 h-6 rounded-full"
                    alt="Condorito"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/condorito-oficial.png';
                    }}
                  />
                  Cumpeo Turismo
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-400 mb-3">
                El Pueblo Temático de Condorito · Región del Maule.<br />
                Municipalidad de Río Claro. Guía turística interactiva con geolocalización GPS.
              </p>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap bg-[#FFE0E2] text-[#C1121F] border border-[#FFA8AE]">¡Reflauta! Bienvenid@s</div>
            </div>

            {/* Columna 2: Info Útil */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span>ℹ️ Info Útil del Visitante</span>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px]">🚌 Cómo llegar</div>
                <div className="text-xs text-gray-400">Desde Talca: Ruta 5 Sur, ~50 km (45 min). Buses desde Terminal Rodoviario Talca.</div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px]">📅 Mejor época</div>
                <div className="text-xs text-gray-400">Octubre–Abril. Vendimia recomendada en Marzo–Abril.</div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px]">🌡️ Clima</div>
                <div className="text-xs text-gray-400">Mediterráneo. Veranos 25–34°C, Inviernos 4–14°C.</div>
              </div>
            </div>

            {/* Columna 3: Contacto & Emergencias */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span>📞 Contacto & Emergencias</span>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-2">🚨 Teléfonos de Emergencia</div>
                <div>
                  <span className="inline-block bg-rojo/20 border border-rojo/40 text-red-300 text-xs font-bold px-2.5 py-[3px] rounded-full m-[2px]">Carabineros: 133</span>
                  <span className="inline-block bg-rojo/20 border border-rojo/40 text-red-300 text-xs font-bold px-2.5 py-[3px] rounded-full m-[2px]">Bomberos: 132</span>
                  <span className="inline-block bg-rojo/20 border border-rojo/40 text-red-300 text-xs font-bold px-2.5 py-[3px] rounded-full m-[2px]">SAMU: 131</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-300 mb-[2px]">🏢 Municipalidad de Río Claro</div>
                <div className="text-xs text-gray-400">Teléfono: +56 71 254 1200</div>
                <div className="text-xs text-gray-400">Email: turismo@rioclaro.cl</div>
              </div>
            </div>

            {/* Columna 4: Enlaces Rápidos */}
            <div>
              <div className="text-sm font-extrabold text-sol uppercase tracking-wider mb-3 font-display">
                <span>🔗 Navegación</span>
              </div>
              <ul className="list-none flex flex-col gap-2">
                <li><Link href="/" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol">🏠 Inicio</Link></li>
                <li><Link href="/mapa" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol">🗺️ Mapa Interactivo GPS</Link></li>
                <li><Link href="/#section-destinos" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol">🎯 Destinos Turísticos</Link></li>
                <li><Link href="/#section-gastronomia" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol">🍽️ Gastronomía Típica</Link></li>
                <li><Link href="/#section-alojamientos" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol">🛏️ Alojamientos</Link></li>
                <li><Link href="/admin" className="text-xs text-gray-400 no-underline transition-colors hover:text-sol">⚙️ Administración</Link></li>
              </ul>
            </div>
          </div>

          {/* Bar inferior copyright */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-md border-t-[1.5px] border-border z-40 flex items-center justify-around px-2" role="navigation" aria-label="Navegación principal">
        <Link href="/" className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/') ? 'text-rojo' : 'text-text-muted'}`}>
          <img src="/assets/images/condorito-oficial.png" className="w-7 h-7 rounded-full object-cover border-2 border-current" alt="Condorito" />
          <span>Inicio</span>
        </Link>
        <Link href="/mapa" className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/mapa') ? 'text-rojo' : 'text-text-muted'}`}>
          <span className="text-2xl flex items-center justify-center">🗺️</span>
          <span>Mapa</span>
        </Link>
        <Link href="/#section-nearby" className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/#section-nearby') ? 'text-rojo' : 'text-text-muted'}`}>
          <span className="text-2xl flex items-center justify-center">📍</span>
          <span>Cercano</span>
        </Link>
        <Link href="/#section-info" className={`flex flex-col items-center justify-center gap-1 w-full h-full no-underline text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isActive('/#section-info') ? 'text-rojo' : 'text-text-muted'}`}>
          <span className="text-2xl flex items-center justify-center">ℹ️</span>
          <span>Info</span>
        </Link>
      </nav>
    </>
  );
}
