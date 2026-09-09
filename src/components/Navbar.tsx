'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  Settings,
  BookOpen,
  Phone,
  Menu,
  X,
  Home,
  Compass,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; type: 'sun' | 'cloud-sun' | 'cloud' | 'rain' } | null>(null);

  useEffect(() => {
    // Fetch clima real de Cumpeo usando Open-Meteo (Sin API Key)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-35.3456&longitude=-71.4123&current_weather=true')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          let type: 'sun' | 'cloud-sun' | 'cloud' | 'rain' = 'cloud';
          if (code === 0 || code === 1) type = 'sun';
          else if (code === 2 || code === 3) type = 'cloud-sun';
          else if (code >= 60 && code <= 69) type = 'rain';

          setWeather({ temp, type });
        }
      })
      .catch((err) => console.error('Error al obtener clima:', err));
  }, []);

  const isActive = (path: string) => pathname === path;

  const renderWeatherIcon = () => {
    if (!weather) return null;
    switch (weather.type) {
      case 'sun':
        return <Sun size={14} className="text-amber-500 animate-spin-slow shrink-0" />;
      case 'cloud-sun':
        return <CloudSun size={14} className="text-amber-500 shrink-0" />;
      case 'rain':
        return <CloudRain size={14} className="text-blue-500 shrink-0" />;
      case 'cloud':
      default:
        return <Cloud size={14} className="text-gray-400 shrink-0" />;
    }
  };

  return (
    <>
      {/* ── DESKTOP TOP NAV ─────── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur-md border-b-[1.5px] border-border z-50"
        role="navigation"
        aria-label="Navegación desktop"
      >
        <div className="w-full max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
          {/* Brand Logo Condorito & Municipalidad de Río Claro */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 no-underline" title="Inicio Cumpeo Turismo">
              <div className="w-[42px] h-[42px] rounded-full bg-sol border-2 border-[#1E1E24] overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
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
                <div className="text-[0.7rem] font-bold text-text-secondary flex items-center gap-1 mt-[2px]">
                  <span>Pueblo de Condorito</span>
                  <span className="bg-rojo text-white text-[9px] px-[5px] py-[1px] rounded-full uppercase leading-none">
                    Maule
                  </span>
                </div>
              </div>
            </Link>

            <div className="h-7 w-px bg-border hidden lg:block" />

            <div className="hidden lg:flex items-center" title="Ilustre Municipalidad de Río Claro">
              <img
                src="/assets/images/logo-muni-rio-claro.png"
                alt="Ilustre Municipalidad de Río Claro"
                className="h-8 max-w-[140px] object-contain"
              />
            </div>
          </div>

          {/* Navigation Menu Links */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${
                isActive('/') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'
              }`}
            >
              <Home size={16} />
              Inicio
            </Link>

            <Link
              href="/ruta"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${
                isActive('/ruta') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'
              }`}
            >
              <Compass size={16} />
              La Ruta
            </Link>

            <Link
              href="/historia"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${
                isActive('/historia') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'
              }`}
            >
              <BookOpen size={16} />
              Historia
            </Link>

            <Link
              href="/contacto"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all no-underline ${
                isActive('/contacto') ? 'text-rojo bg-rojo/10' : 'text-text-secondary hover:text-rojo hover:bg-rojo/5'
              }`}
            >
              <Phone size={16} />
              Contacto
            </Link>
          </div>

          {/* Actions / CTAs */}
          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft border border-border text-xs font-bold text-text-secondary"
              title="Clima actual en Cumpeo"
            >
              {weather ? (
                <>
                  {renderWeatherIcon()}
                  <span>{weather.temp}°C Cumpeo</span>
                </>
              ) : (
                'Cargando clima...'
              )}
            </div>
            <Link
              href="/mapa"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sol hover:bg-sol-dark text-[#1E1E24] text-sm font-extrabold no-underline transition-all shadow-sm"
              title="Abrir Mapa GPS de Condorito"
            >
              <Map size={16} /> Abrir Mapa GPS
            </Link>
            <Link
              href="/admin"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-soft border border-border text-text-secondary hover:bg-rojo hover:border-rojo hover:text-white transition-all"
              title="Panel Admin"
              aria-label="Panel de Administración"
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE HEADER BAR ─────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-[58px] bg-white/95 backdrop-blur-md border-b-[1.5px] border-border z-40 flex items-center justify-between px-3"
        role="banner"
      >
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-full bg-sol border-2 border-[#1E1E24] overflow-hidden shadow-sm shrink-0 flex items-center justify-center relative">
            <img src="/assets/images/condorito-oficial.png" alt="Condorito Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="text-[1.05rem] font-extrabold text-rojo leading-none font-display">Cumpeo Turismo</div>
            <div className="text-[0.65rem] font-bold text-text-secondary mt-[1px]">Pueblo de Condorito</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <img
            src="/assets/images/logo-muni-rio-claro.png"
            alt="Muni Río Claro"
            className="h-6 max-w-[85px] object-contain opacity-85"
          />
          <button
            className="bg-transparent border-none text-text-primary font-bold text-sm p-1.5 flex items-center cursor-pointer rounded-lg hover:bg-surface-soft"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OVER DRAWER MENU ─────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white flex flex-col shadow-lg z-50 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
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
                className="bg-transparent border-none text-white cursor-pointer p-1 rounded-lg hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
              <div className="px-4 pb-4">
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-surface-soft border border-border text-xs font-bold text-text-secondary w-full">
                  {weather ? (
                    <>
                      {renderWeatherIcon()}
                      <span>{weather.temp}°C Cumpeo</span>
                    </>
                  ) : (
                    'Cargando clima...'
                  )}
                </div>
              </div>

              <Link
                href="/"
                className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${
                  isActive('/') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <Home size={18} className="text-rojo" /> Inicio
              </Link>
              <Link
                href="/ruta"
                className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${
                  isActive('/ruta') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <Compass size={18} className="text-rojo" /> La Ruta de Condorito
              </Link>
              <Link
                href="/historia"
                className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${
                  isActive('/historia') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <BookOpen size={18} className="text-rojo" /> Historia del Pueblo
              </Link>
              <Link
                href="/contacto"
                className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${
                  isActive('/contacto') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <Phone size={18} className="text-rojo" /> Contacto e Información
              </Link>
              <Link
                href="/admin"
                className={`flex items-center gap-3 py-3 px-6 text-sm font-bold text-text-primary no-underline transition-colors hover:bg-surface-soft ${
                  isActive('/admin') ? 'bg-rojo/10 text-rojo border-l-4 border-rojo' : ''
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <Settings size={18} className="text-rojo" /> Panel de Administración
              </Link>

              <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2.5 px-4">
                <Link
                  href="/mapa"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-sol hover:bg-sol-dark text-[#1E1E24] text-sm font-extrabold no-underline transition-all w-full shadow-sm"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Map size={18} /> Abrir Mapa GPS
                </Link>
                <div className="text-center text-[0.75rem] text-text-muted mt-2">
                  <em>&quot;¡Exijo una explicación! — Ven a Cumpeo&quot;</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
