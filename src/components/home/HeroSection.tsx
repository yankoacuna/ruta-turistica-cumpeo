'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, ChevronRight, X, Compass, QrCode } from 'lucide-react';
import { Destination } from '@/lib/types';
import { Editable, useSiteText } from '@/components/site-text';

interface HeroSectionProps {
  destinations: Destination[];
}

export function HeroSection({ destinations }: HeroSectionProps) {
  const { get } = useSiteText();
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
    <>
      {/* Franja institucional: encuadra el sitio como portal municipal oficial.
          Reemplaza al logo flotante y al badge de vidrio que antes competian
          con el titular dentro de la foto. */}
      <div className="w-full bg-ink text-paper-deep">
        <div className="max-w-shell mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold tracking-wide">
            <Editable k="home.hero.municipalidad" />
            <span className="hidden sm:inline">
              {' · '}
              <Editable k="home.hero.region" />
            </span>
          </span>
          <Editable
            k="home.hero.portalBadge"
            className="text-xs font-bold uppercase tracking-[0.14em] text-sol shrink-0"
          />
        </div>
      </div>

      <section
        className="relative w-full min-h-[76svh] md:min-h-[600px] flex items-end overflow-hidden"
        aria-label="Bienvenida a Cumpeo"
      >
        {/* Foto real del pueblo. El degradado es mucho mas liviano que antes:
            la foto es el activo de marca, no un fondo que hay que tapar. */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            className="w-full h-full object-cover object-[center_38%]"
            src="/assets/images/letras-cumpeo-cone.jpg"
            alt="Letras de Cumpeo, el pueblo temático de Condorito"
            /* Es el elemento LCP de la portada: se pide con prioridad alta. */
            fetchPriority="high"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
            }}
          />
          {/* Solo el degradado, sin trama: la foto del hero se deja limpia. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/5 md:bg-gradient-to-r md:from-ink md:via-ink/60 md:to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-shell mx-auto px-4 pt-14 pb-14 md:pt-24 md:pb-20">
          <div className="max-w-2xl">
            {/* Escala asimetrica: "Cumpeo" domina, el subtitular acompaña.
                Antes los cinco elementos tenian el mismo peso visual. */}
            <h1 className="font-display font-bold text-white">
              <Editable k="home.hero.titulo" className="block text-display-xl" />
              <Editable
                k="home.hero.subtitulo"
                className="block text-display-md text-sol mt-1"
              />
            </h1>

            <Editable
              k="home.hero.bajada"
              as="p"
              className="text-base md:text-lg leading-relaxed text-paper-deep mt-5 max-w-lg"
              multiline
            />

            {/* Una sola accion primaria. El mapa queda como secundaria y el
                buscador baja de nivel: era el primer elemento y no deberia. */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/ruta"
                className="min-h-[54px] px-6 inline-flex items-center justify-center gap-2.5 rounded-full bg-rojo hover:bg-rojo-light text-white text-base font-bold no-underline border-2 border-ink shadow-comic active:translate-x-[1px] active:translate-y-[1px] active:shadow-comic-sm transition-all"
              >
                <Compass size={20} /> <Editable k="home.hero.ctaRuta" />
              </Link>
              <Link
                href="/mapa"
                className="min-h-[54px] px-6 inline-flex items-center justify-center gap-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-base font-bold no-underline border-[1.5px] border-white/40 backdrop-blur-sm transition-all"
              >
                <MapPin size={19} /> <Editable k="home.hero.ctaMapa" />
              </Link>
            </div>

            {/* Buscador: secundario, ancho acotado. */}
            <div ref={searchRef} className="w-full max-w-[440px] relative z-40 mt-5">
              <div
                className="relative w-full bg-white rounded-full border-[1.5px] border-white/50 focus-within:border-rojo flex items-center px-4 transition-colors"
                role="search"
              >
                <Search size={17} className="text-text-muted mr-2.5 shrink-0" />
                <input
                  type="text"
                  autoComplete="off"
                  className="flex-1 bg-transparent border-none outline-none text-base sm:text-sm text-text-primary py-3"
                  placeholder={get('home.hero.buscador')}
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
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={18} />
                  </button>
                )}

                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2.5 bg-white border-[1.5px] border-ink rounded-xl z-[100] max-h-[45svh] overflow-y-auto overflow-hidden shadow-comic divide-y divide-border">
                    {searchResults.map((d) => (
                      <Link
                        key={d.id}
                        href={`/destino/${d.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-3.5 flex items-center gap-3 no-underline text-text-primary hover:bg-paper-warm transition-colors"
                      >
                        <MapPin size={16} className="text-rojo shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{d.nombre}</div>
                          <div className="text-xs text-text-muted capitalize truncate">
                            {d.categoria}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-text-muted shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Guiño al caso de uso real del EETT: se llega escaneando el QR de la
            señaletica en la calle. Solo desktop, donde hay aire de sobra. */}
        <div className="hidden lg:flex absolute bottom-8 right-6 z-10 items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm text-white">
          <QrCode size={17} className="text-sol shrink-0" />
          <Editable k="home.hero.qrAviso" className="text-xs font-semibold" />
        </div>
      </section>
    </>
  );
}
