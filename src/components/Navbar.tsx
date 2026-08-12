'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Settings } from 'lucide-react';

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
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur-md border-b-[1.5px] border-border z-50" role="navigation" aria-label="Navegación desktop">
        <div className="w-full max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
          {/* Brand Logo Condorito */}
          <Link href="/" className="flex items-center gap-[10px] no-underline" title="Inicio Cumpeo Turismo">
            <div className="w-[44px] h-[44px] rounded-full bg-sol border-2 border-[#1E1E24] overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
              <img
                src="/assets/images/condorito-oficial.png"
                alt="Condorito Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/condorito-oficial.png';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="text-[1.15rem] font-extrabold text-rojo leading-none font-display">Cumpeo Turismo</div>
              <div className="text-[0.72rem] font-bold text-text-secondary flex items-center gap-1 mt-[2px]">
                <span>El Pueblo de Condorito</span>
                <span className="bg-rojo text-white text-[9px] px-[6px] py-[2px] rounded-full uppercase leading-none">¡PLOP!</span>
              </div>
            </div>
          </Link>

          {/* Navigation Menu Links */}
          <div className="flex items-center gap-2">
            <Link href="/" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${isActive('/') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'}`}>
              <span className="flex items-center justify-center w-5 h-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11L12 3L21 11V20C21 20.6 20.6 21 20 21H15V16H9V21H4C3.4 21 3 20.6 3 20V11Z" fill="#FFD60A" stroke="#1E1E24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="9" y="15.5" width="6" height="5.5" rx="1" fill="#E63946" stroke="#1E1E24" strokeWidth="1.8"/>
                </svg>
              </span>
              Inicio
            </Link>

            <Link href="/historia" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${isActive('/historia') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'}`}>
              <span className="flex items-center justify-center w-5 h-5 text-[1.2rem]">📜</span>
              Historia
            </Link>

            <Link href="/#section-destinos" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-text-secondary hover:text-rojo hover:bg-rojo/5 transition-all no-underline">
              <span className="flex items-center justify-center w-5 h-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9.5" fill="#8338EC" stroke="#1E1E24" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="5.5" fill="#FFD60A" stroke="#1E1E24" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2.3" fill="#E63946" stroke="#1E1E24" strokeWidth="1.5"/>
                </svg>
              </span>
              Destino
            </Link>

            <Link href="/contacto" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${isActive('/contacto') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'}`}>
              <span className="flex items-center justify-center w-5 h-5 text-[1.2rem]">📞</span>
              Contactanos
            </Link>
          </div>

          {/* Actions / CTAs */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft border border-border text-xs font-bold text-text-secondary" title="Clima actual en Cumpeo">
              {weather ? `${weather.icon} ${weather.temp}°C Cumpeo` : 'Cargando clima...'}
            </div>
            <Link href="/mapa" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sol hover:bg-sol-dark text-[#1E1E24] text-sm font-extrabold no-underline transition-all" title="Abrir Mapa GPS de Condorito">
              <Map size={16} /> Abrir Mapa GPS
            </Link>
            <Link href="/admin" className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-soft border border-border text-text-secondary hover:bg-rojo hover:border-rojo hover:text-white transition-all" title="Panel Admin" aria-label="Panel de Administración">
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE HEADER BAR ─────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[56px] bg-white/95 backdrop-blur-md border-b-[1.5px] border-border z-40 flex items-center justify-between px-4" role="banner">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-10 h-10 rounded-full bg-sol border-2 border-[#1E1E24] overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
            <img src="/assets/images/condorito-oficial.png" alt="Condorito Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="text-[1.15rem] font-extrabold text-rojo leading-none font-display">Cumpeo Turismo</div>
            <div className="text-[0.72rem] font-bold text-text-secondary mt-[2px]">El Pueblo de Condorito</div>
          </div>
        </Link>
        <button className="bg-transparent border-none text-text-primary font-bold text-sm px-2 py-1 flex items-center gap-1 cursor-pointer" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
          ☰ Menú
        </button>
      </header>

      {/* ── MOBILE SLIDE-OVER DRAWER MENU ─────── */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 transition-opacity" onClick={() => setDrawerOpen(false)}>
          <div className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white flex flex-col shadow-lg z-50 transition-transform" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-rojo flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-full bg-sol border-2 border-[#1E1E24] overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
                  <img src="/assets/images/condorito-oficial.png" alt="Condorito" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-display text-[1.15rem] font-black text-sol leading-tight">
                    Cumpeo Turismo
                  </div>
                  <div className="text-[0.75rem] text-gray-200 font-semibold">Pelotillehue Real</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="bg-transparent border-none text-white text-[1.6rem] cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
              <div className="px-4 pb-4">
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft border border-border text-xs font-bold text-text-secondary w-full">
                  {weather ? `${weather.icon} ${weather.temp}°C Cumpeo` : 'Cargando clima...'}
                </div>
              </div>
              <Link href="/" className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${isActive('/') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>🏠</span> Inicio
              </Link>
              <Link href="/historia" className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${isActive('/historia') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>📜</span> Historia
              </Link>
              <Link href="/#section-destinos" className="flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft" onClick={() => setDrawerOpen(false)}>
                <span>🎯</span> Destino
              </Link>
              <Link href="/contacto" className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${isActive('/contacto') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>📞</span> Contactanos
              </Link>
              <Link href="/admin" className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${isActive('/admin') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''}`} onClick={() => setDrawerOpen(false)}>
                <span>⚙️</span> Panel de Administración
              </Link>

              <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2.5 px-4">
                <Link href="/mapa" className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-sol hover:bg-sol-dark text-[#1E1E24] text-sm font-extrabold no-underline transition-all w-full" onClick={() => setDrawerOpen(false)}>
                  🗺️ Abrir Mapa GPS
                </Link>
                <div className="text-center text-[0.75rem] text-text-muted mt-2">
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
