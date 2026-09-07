'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Map, MapPin, Compass, Navigation, ChevronRight, X } from 'lucide-react';
import { Destination } from '@/lib/types';

interface HeroSectionProps {
  destinations: Destination[];
  onGPSClick: () => void;
  isLocating: boolean;
}

export function HeroSection({ destinations, onGPSClick, isLocating }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? destinations.filter(
        (d) =>
          d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.descripcionCorta.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <section
      className="relative w-full min-h-[520px] md:min-h-[600px] flex items-center border-b-4 border-rojo overflow-hidden"
      aria-label="Bienvenida a Cumpeo"
    >
      {/* Imagen de fondo: foto real del pueblo de Cumpeo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          className="w-full h-full object-cover object-[center_40%] transform scale-100 transition-transform duration-[3000ms] ease-out"
          src="/assets/images/letras-cumpeo-cone.jpg"
          alt="Vista del pueblo tematico de Cumpeo"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 py-14 md:py-20 flex flex-col gap-5">
        {/* Logo municipal blanco */}
        <img
          src="/assets/images/logo-muni-blanco.png"
          alt="Ilustre Municipalidad de Rio Claro"
          className="h-10 md:h-12 w-auto object-contain drop-shadow-lg self-start"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Badge institucional */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white border border-white/25 backdrop-blur-md self-start shadow-sm">
          <span className="w-2 h-2 rounded-full bg-sol animate-pulse" />
          Portal Oficial de Turismo - Cumpeo, Region del Maule
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl leading-[1.1] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.7)] max-w-3xl">
          Cumpeo, <br />
          <span className="text-sol">el Pueblo de Condorito</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-200 max-w-2xl [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
          El unico pueblo tematico del mundo ambientado en la obra de Pepo. Recorre esculturas a tamaño real, monumentos, gastronomia criolla y la autentica hospitalidad del campo maulino.
        </p>

        {/* Buscador inteligente superpuesto */}
        <div ref={searchRef} className="w-full max-w-[620px] relative z-40 mt-1">
          <div
            className="relative w-full bg-white border-2 border-white/40 focus-within:border-rojo rounded-full shadow-2xl flex items-center px-4 py-1 transition-all"
            role="search"
          >
            <Search size={18} className="text-rojo mr-2.5 shrink-0" />
            <input
              type="text"
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary py-2.5"
              placeholder="Buscar monumentos, picadas, artesanias o estatuas..."
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsSearchOpen(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchOpen(false);
              }}
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-text-muted hover:text-rojo p-1 mr-1 transition-colors cursor-pointer"
                aria-label="Limpiar busqueda"
              >
                <X size={16} />
              </button>
            )}

            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-border rounded-2xl z-[100] max-h-[320px] overflow-y-auto shadow-2xl divide-y divide-border">
                {searchResults.map((d) => (
                  <Link
                    key={d.id}
                    href={`/destino/${d.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="px-4 py-3 flex items-center gap-3 no-underline text-text-primary hover:bg-surface-soft transition-colors"
                  >
                    <MapPin size={16} className="text-rojo shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{d.nombre}</div>
                      <div className="text-xs text-text-muted capitalize truncate">{d.categoria}</div>
                    </div>
                    <ChevronRight size={14} className="text-text-muted shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botones de accion principal */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Link
            href="/ruta"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full text-sm font-black bg-rojo text-white shadow-lg hover:bg-rojo-dark hover:scale-[1.02] active:scale-[0.98] transition-all no-underline"
          >
            <Compass size={17} /> Recorrer La Ruta Oficial
          </Link>
          <Link
            href="/mapa"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all no-underline"
          >
            <Map size={17} /> Mapa GPS en Vivo
          </Link>
          <button
            onClick={onGPSClick}
            disabled={isLocating}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Navigation size={15} className={isLocating ? 'animate-spin' : ''} />
            {isLocating ? 'Detectando GPS...' : 'Cerca de mi'}
          </button>
        </div>
      </div>
    </section>
  );
}
