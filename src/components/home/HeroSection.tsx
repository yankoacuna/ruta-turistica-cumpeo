'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, ChevronRight, X } from 'lucide-react';
import { Destination } from '@/lib/types';

interface HeroSectionProps {
  destinations: Destination[];
}

export function HeroSection({ destinations }: HeroSectionProps) {
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
    ? destinations
        .filter(
          (d) =>
            d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.descripcionCorta.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.categoria.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <section
      className="relative w-full min-h-[64svh] md:min-h-[520px] flex items-end border-b-4 border-rojo"
      aria-label="Bienvenida a Cumpeo"
    >
      {/* Imagen de fondo: foto real del pueblo de Cumpeo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          className="w-full h-full object-cover object-[center_40%]"
          src="/assets/images/letras-cumpeo-cone.jpg"
          alt="Vista del pueblo tematico de Cumpeo"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
          }}
        />
        {/* En mobile el texto ocupa todo el ancho: el degradado va de abajo hacia
            arriba. En desktop el contenido se alinea a la izquierda. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/60 to-black/25 md:bg-gradient-to-r md:from-black/90 md:via-black/60 md:to-black/15" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 pt-10 pb-16 md:pt-20 md:pb-24 flex flex-col gap-4">
        {/* Logo municipal blanco */}
        <img
          src="/assets/images/logo-muni-blanco.png"
          alt="Ilustre Municipalidad de Rio Claro"
          className="h-8 md:h-12 w-auto object-contain drop-shadow-lg self-start"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Badge institucional: ruido en pantallas chicas, se muestra desde sm */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white border border-white/25 backdrop-blur-md self-start">
          <span className="w-2 h-2 rounded-full bg-sol animate-pulse" />
          Portal Oficial de Turismo - Cumpeo, Region del Maule
        </div>

        <h1 className="font-display font-black text-[2rem] leading-[1.08] sm:text-5xl md:text-6xl text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.7)] max-w-3xl">
          Cumpeo, <br />
          <span className="text-sol">el Pueblo de Condorito</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-200 max-w-2xl [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] line-clamp-2 sm:line-clamp-none">
          El unico pueblo tematico del mundo ambientado en la obra de Pepo. Esculturas a tamaño
          real, gastronomia criolla y la hospitalidad del campo maulino.
        </p>

        {/* Buscador */}
        <div ref={searchRef} className="w-full max-w-[620px] relative z-40 mt-1">
          <div
            className="relative w-full bg-white border-2 border-white/40 focus-within:border-rojo rounded-full shadow-2xl flex items-center px-4 transition-all"
            role="search"
          >
            <Search size={18} className="text-rojo mr-2.5 shrink-0" />
            <input
              type="text"
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none text-base sm:text-sm text-text-primary py-3.5"
              placeholder="Buscar monumentos, picadas o estatuas..."
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
                className="h-11 w-9 -mr-1 inline-flex items-center justify-center text-text-muted hover:text-rojo transition-colors cursor-pointer"
                aria-label="Limpiar busqueda"
              >
                <X size={18} />
              </button>
            )}

            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-border rounded-2xl z-[100] max-h-[45svh] overflow-y-auto shadow-2xl divide-y divide-border">
                {searchResults.map((d) => (
                  <Link
                    key={d.id}
                    href={`/destino/${d.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="px-4 py-3.5 flex items-center gap-3 no-underline text-text-primary hover:bg-surface-soft transition-colors"
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
      </div>
    </section>
  );
}
