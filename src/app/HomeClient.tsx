'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  sortByDistance,
  formatDistance,
  getCategoryEmoji,
  getCategoryColorClass,
  formatImgUrl,
} from '@/lib/data';
import { Destination, Accommodation, Restaurant, AppConfig } from '@/lib/types';
import { useToast } from '@/components/Toast';

// Mapa estático de estilos de badge por color de categoría
const BADGE_STYLES: Record<string, string> = {
  rojo:        'bg-[#FFE0E2] text-[#C1121F] border-[#FFA8AE]',
  sol:         'bg-[#FFF3C4] text-[#B47900] border-[#FFE07D]',
  cielo:       'bg-[#E0F2FE] text-[#023E8A] border-[#BAE6FD]',
  verde:       'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  tierra:      'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  gray:        'bg-[#EAE8E1] text-[#4A4E69] border-[#D5D3C8]',
  patrimonio:  'bg-[#EDE9FE] text-[#5B21B6] border-[#C4B5FD]',
};
const getBadgeStyle = (colorClass: string) => BADGE_STYLES[colorClass] || BADGE_STYLES.gray;

interface HomeClientProps {
  initialConfig: AppConfig;
  initialDestinations: Destination[];
  initialFeatured: Destination[];
  initialAccommodations: Accommodation[];
  initialRestaurants: Restaurant[];
}

export default function HomeClient({
  initialConfig,
  initialDestinations,
  initialFeatured,
  initialAccommodations,
  initialRestaurants
}: HomeClientProps) {
  const { showToast } = useToast();
  const [config, setConfig] = useState<AppConfig | null>(initialConfig);
  const [categories, setCategories] = useState<any[]>(initialConfig.categorias || []);
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
  const [featured, setFeatured] = useState<Destination[]>(initialFeatured);
  const [accommodations, setAccommodations] = useState<Accommodation[]>(initialAccommodations);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>(initialDestinations);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyList, setNearbyList] = useState<Destination[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasGPS, setHasGPS] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const storedFavs = JSON.parse(localStorage.getItem('fav_destinos') || '[]');
    setFavorites(storedFavs);
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter((f) => f !== id);
      showToast('Quitado de favoritos', 'info');
    } else {
      updated = [...favorites, id];
      showToast('Guardado en tus favoritos', 'success');
    }
    setFavorites(updated);
    localStorage.setItem('fav_destinos', JSON.stringify(updated));
  };

  const handleCategoryFilter = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'gastronomia') {
      document.getElementById('section-gastronomia')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (catId === 'alojamiento') {
      document.getElementById('section-alojamientos')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (catId === 'todos') {
      setFilteredDestinations(destinations);
    } else {
      setFilteredDestinations(destinations.filter((d) => d.categoria === catId));
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalización GPS', 'error');
      return;
    }
    setIsLocating(true);
    showToast('Obteniendo tu posición GPS...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setIsLocating(false);
        setHasGPS(true);

        const pois = destinations.map((d) => ({
          ...d,
          tipo: 'destino' as const,
          descripcionCorta: d.descripcionCorta,
        }));
        const sorted = sortByDistance(pois as any, coords);
        setNearbyList(sorted.slice(0, 5) as any);
        setFilteredDestinations(sorted as any);
        showToast('Destinos más cercanos actualizados con tu GPS', 'success');
        setTimeout(() => {
          document.getElementById('section-nearby')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (err) => {
        setIsLocating(false);
        showToast('No se pudo obtener el GPS: ' + err.message, 'error');
      }
    );
  };

  const searchResults = searchQuery.trim()
    ? destinations.filter((d) =>
        d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.descripcionCorta.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div>
      {/* ── HERO SECTION ─────── */}
      <section
        className="relative w-full min-h-[420px] h-[52vh] max-h-[520px] md:h-[50vh] md:min-h-[440px] flex items-end overflow-hidden border-b-2 border-rojo"
        aria-label="Bienvenida a Cumpeo"
      >
        <img
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="/assets/images/hero-cumpeo.webp"
          alt="Paisaje rural de Cumpeo, Región del Maule"
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/75 to-black/95" />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 py-6 md:py-8 flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sol text-[#1E1E24] text-[0.7rem] font-extrabold uppercase tracking-wide w-fit shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <img src="/assets/images/condorito-oficial.png" className="w-5 h-5 rounded-full" alt="Condorito" />
            ¡Bienvenidos a Pelotillehue Real!
          </div>

          <h1 className="font-display font-black text-[2.6rem] md:text-[3.4rem] leading-[1.1] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            Cumpeo,<br />
            <span className="text-sol">el Pueblo de Condorito</span>
          </h1>

          <p className="text-sm leading-relaxed text-white/90 max-w-xl mb-4">
            Recorre el único pueblo real de la historieta chilena más famosa del mundo. Murales, estatuas, gastronomía y patrimonio maulino.
          </p>

          {/* Buscador Integrado */}
          <div className="w-full max-w-[650px] mt-4 mb-4 relative z-[30]">
            <div
              className="relative w-full bg-white border-2 border-rojo rounded-full shadow-[0_8px_24px_rgba(230,57,70,0.15)] flex items-center px-4 py-1 focus-within:shadow-[0_10px_28px_rgba(230,57,70,0.25)]"
              role="search"
            >
              <span className="text-lg text-rojo mr-2.5">🔍</span>
              <input
                type="search"
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary py-2"
                placeholder="Buscar atracciones, restaurantes, viñedos en Cumpeo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-border rounded-[22px] z-50 max-h-[300px] overflow-y-auto shadow-xl">
                  {searchResults.map((d) => (
                    <Link
                      key={d.id}
                      href={`/destino/${d.slug}`}
                      className="px-4 py-3 flex items-center gap-3 border-b border-border no-underline text-text-primary hover:bg-surface-soft"
                    >
                      <span className="text-[1.3rem]">{getCategoryEmoji(d.categoria)}</span>
                      <div>
                        <div className="text-[0.9rem] font-semibold">{d.nombre}</div>
                        <div className="text-[0.75rem] text-text-muted">{d.categoria}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-1">
            <Link
              href="/mapa"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full text-lg font-bold bg-rojo text-white shadow-rojo hover:-translate-y-0.5 hover:bg-rojo-dark active:scale-[0.98] transition-all no-underline"
            >
              🗺️ Mapa GPS Condorito
            </Link>
            <a
              href="#section-nearby"
              onClick={handleGPSLocation}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full text-lg font-bold bg-white text-text-primary border-2 border-border hover:bg-surface-soft hover:border-rojo hover:text-rojo transition-all no-underline"
            >
              📍 Cerca de mí
            </a>
          </div>
        </div>
      </section>

      <div id="main-content">
        {/* ── CERCA DE TI ─────── */}
        {hasGPS && (
          <>
            <section className="py-6 w-full max-w-[1200px] mx-auto px-4" id="section-nearby" aria-label="Destinos cercanos a tu ubicación">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary flex items-center gap-2 relative pb-2 mb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
                    📍 Cerca de ti
                  </h2>
                  <div className="text-sm text-text-secondary font-medium mt-0.5">Tus lugares más próximos en Cumpeo</div>
                </div>
                <button
                  className="text-xs font-bold text-rojo inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0F1] border border-[#FFCCD0] hover:bg-rojo hover:text-white hover:border-rojo transition-all"
                  onClick={handleGPSLocation}
                  aria-label="Actualizar ubicación"
                >
                  Actualizar 🔄
                </button>
              </div>

              <div id="nearby-container" className="flex flex-col gap-3">
                {nearbyList.map((item) => (
                  <article key={item.id} className="bg-white border-[1.5px] border-border rounded-2xl overflow-hidden flex shadow-sm hover:border-rojo hover:shadow-md transition-all">
                    <Link href={`/destino/${item.slug}`} className="flex w-full no-underline text-text-primary">
                      <div className="w-[130px] min-w-[130px] min-h-[110px] bg-surface-soft relative overflow-hidden shrink-0">
                        <img
                          className="w-full h-full object-cover"
                          src={formatImgUrl(item.imagenPrincipal)}
                          alt={item.nombre}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
                        />
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-center gap-[3px] overflow-hidden">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap border self-start ${getBadgeStyle(getCategoryColorClass(item.categoria))}`}>
                          {getCategoryEmoji(item.categoria)} {item.categoria}
                        </span>
                        <div className="text-[0.9rem] font-bold text-text-primary font-display">{item.nombre}</div>
                        <div className="text-[0.75rem] text-text-secondary leading-[1.4] line-clamp-2">{item.descripcionCorta || ''}</div>
                        <div className="text-[0.7rem] text-text-muted mt-1 flex gap-2">
                          <span>📍 {formatDistance((item as any).distanciaKm || 0)}</span>
                          {item.precio && <span>· {item.precio}</span>}
                        </div>
                      </div>
                      <div className="flex items-center px-3">
                        <span className="text-text-muted text-[18px]">›</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
            <div className="h-px bg-border my-4 w-full" />
          </>
        )}

        {/* ── CATEGORÍAS GRID ─────── */}
        <section className="py-6 w-full max-w-[1200px] mx-auto px-4" aria-label="Categorías de interés">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary flex items-center gap-2 relative pb-2 mb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
                ✨ Categorías
              </h2>
              <div className="text-sm text-text-secondary font-medium mt-0.5">Explora Cumpeo según tus intereses turísticos</div>
            </div>
            <Link href="/mapa" className="text-xs font-bold text-rojo inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0F1] border border-[#FFCCD0] hover:bg-rojo hover:text-white hover:border-rojo transition-all no-underline">
              Ver en mapa →
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" role="navigation" aria-label="Categorías turísticas">
            {categories.map((cat) => (
              <Link
                href={`/categoria/${cat.id}`}
                key={cat.id}
                className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-cover bg-center cursor-pointer hover:-translate-y-[3px] hover:border-sol border-2 border-transparent transition-transform no-underline"
                style={{ backgroundImage: `url(${cat.imagen || '/assets/images/placeholder.webp'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70" />
                <div className="relative z-[2] h-full flex flex-col items-center justify-end p-3 gap-1">
                  <h3 className="text-[0.65rem] font-extrabold font-display text-white text-center uppercase tracking-[0.03em] leading-tight [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">{cat.nombre}</h3>
                  <button className="text-[0.6rem] px-2 py-[3px] rounded-full bg-sol text-[#1E1E24] font-extrabold uppercase border-none cursor-pointer" tabIndex={-1}>{cat.botonTexto || 'VER'}</button>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="h-px bg-border my-4 w-full" />

        {/* ── DESTINOS ─────── */}
        <section className="py-6 w-full max-w-[1200px] mx-auto px-4" id="section-destinos" aria-label="Destinos y atracciones">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary flex items-center gap-2 relative pb-2 mb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
                📸 {activeCategory === 'todos' ? 'Todos los Destinos' : `Destinos: ${categories.find(c => c.id === activeCategory)?.nombre || activeCategory}`}
              </h2>
              <div className="text-sm text-text-secondary font-medium mt-0.5">Lugares increíbles para descubrir</div>
            </div>
            {activeCategory !== 'todos' && (
               <button onClick={() => handleCategoryFilter('todos')} className="text-xs font-bold text-text-muted hover:text-rojo transition-colors underline text-left sm:text-right">Ver todos</button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredDestinations.length > 0 ? filteredDestinations.map((item) => (
              <article key={item.id} className="bg-white border-[1.5px] border-border rounded-2xl overflow-hidden shadow-sm hover:border-rojo hover:shadow-md transition-all flex flex-col h-full">
                <Link href={`/destino/${item.slug}`} className="no-underline text-inherit flex flex-col h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src={formatImgUrl(item.imagenPrincipal)}
                      alt={item.nombre}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
                    />
                    <div className="absolute top-2 left-2 z-[2]">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.55rem] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap border ${getBadgeStyle(getCategoryColorClass(item.categoria))}`}>
                        {getCategoryEmoji(item.categoria)} {item.categoria}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="text-[0.9rem] sm:text-[1.1rem] font-extrabold font-display text-text-primary leading-tight mb-1">{item.nombre}</div>
                    <div className="text-[0.75rem] text-text-secondary leading-[1.4] line-clamp-2 mb-2 flex-1">{item.descripcionCorta}</div>
                    {item.precio && <div className="text-[0.7rem] sm:text-[0.75rem] text-text-muted mt-auto">💰 {item.precio}</div>}
                  </div>
                </Link>
              </article>
            )) : (
              <div className="col-span-full py-8 text-center text-text-muted bg-surface-soft rounded-2xl border border-dashed border-border">
                No hay destinos en esta categoría.
              </div>
            )}
          </div>
        </section>

        <div className="h-px bg-border my-4 w-full" />

        {/* ── DESTACADOS ─────── */}
        <section className="py-6 w-full max-w-[1200px] mx-auto px-4" aria-label="Destinos destacados">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary flex items-center gap-2 relative pb-2 mb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
                ⭐ Imperdibles de Cumpeo
              </h2>
              <div className="text-sm text-text-secondary font-medium mt-0.5">Los lugares más icónicos que debes visitar</div>
            </div>
            <Link href="/mapa" className="text-xs font-bold text-rojo inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0F1] border border-[#FFCCD0] hover:bg-rojo hover:text-white hover:border-rojo transition-all no-underline">
              Ver mapa completo →
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-sm">
            {featured.map((item) => (
              <article
                key={item.id}
                className="bg-white border-[1.5px] border-border rounded-2xl overflow-hidden w-[190px] min-w-[190px] shrink-0 cursor-pointer hover:-translate-y-[3px] hover:border-rojo hover:shadow-md transition-all [scroll-snap-align:start]"
                role="button"
                tabIndex={0}
              >
                <Link href={`/destino/${item.slug}`} className="no-underline text-inherit block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-soft">
                    <img
                      className="w-full h-full object-cover"
                      src={formatImgUrl(item.imagenPrincipal)}
                      alt={item.nombre}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
                    />
                    <div className="absolute top-2 left-2 z-[2]">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.55rem] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap border ${getBadgeStyle(getCategoryColorClass(item.categoria))}`}>
                        {getCategoryEmoji(item.categoria)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[1.1rem] font-extrabold font-display text-text-primary mb-1">{item.nombre}</div>
                    {item.precio && <div className="text-[0.75rem] text-text-muted">{item.precio}</div>}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ── GASTRONOMÍA MAULINA ─────── */}
        <section className="py-6 w-full max-w-[1200px] mx-auto px-4" id="section-gastronomia" aria-label="Restaurantes y gastronomía">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary flex items-center gap-2 relative pb-2 mb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
                🍽️ Gastronomía Típica
              </h2>
              <div className="text-sm text-text-secondary font-medium mt-0.5">Donde comer y disfrutar los sabores del Maule</div>
            </div>
            <span className="text-sm text-text-muted">{restaurants.length} locales</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-sm" role="list">
            {restaurants.map((item) => (
              <article key={item.id} className="bg-white border-[1.5px] border-border rounded-2xl overflow-hidden flex shrink-0 w-[340px] min-w-[310px] shadow-sm hover:border-rojo hover:shadow-md transition-all [scroll-snap-align:start]">
                <div className="w-[130px] min-w-[130px] min-h-[110px] bg-surface-soft relative overflow-hidden shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={formatImgUrl(item.imagenPrincipal)}
                    alt={item.nombre}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center gap-[3px] overflow-hidden">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap border self-start bg-[#FFE0E2] text-[#C1121F] border-[#FFA8AE]">
                    🍽️ Gastronomía
                  </span>
                  <div className="text-[0.9rem] font-bold text-text-primary font-display">{item.nombre}</div>
                  <div className="text-[0.75rem] text-text-secondary leading-[1.4] line-clamp-2">{item.descripcion || ''}</div>
                  <div className="text-[0.7rem] text-text-muted mt-1">📍 {item.direccion}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/categoria/gastronomia" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-rojo border-2 border-rojo hover:bg-[#FFF0F1] transition-all no-underline">
              Ver más opciones de Gastronomía
            </Link>
          </div>
        </section>

        <div className="h-px bg-border my-4 w-full" />

        {/* ── ALOJAMIENTOS ─────── */}
        <section className="py-6 w-full max-w-[1200px] mx-auto px-4" id="section-alojamientos" aria-label="Alojamientos en Cumpeo">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-[1.6rem] text-text-primary flex items-center gap-2 relative pb-2 mb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-rojo after:rounded-full">
                🛏️ Alojamientos
              </h2>
              <div className="text-sm text-text-secondary font-medium mt-0.5">Hospedajes y cabañas para descansar</div>
            </div>
            <span className="text-sm text-text-muted">{accommodations.length} opciones</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-sm" role="list">
            {accommodations.map((item) => (
              <article key={item.id} className="bg-white border-[1.5px] border-border rounded-2xl overflow-hidden flex shrink-0 w-[340px] min-w-[310px] shadow-sm hover:border-rojo hover:shadow-md transition-all [scroll-snap-align:start]">
                <div className="w-[130px] min-w-[130px] min-h-[110px] bg-surface-soft relative overflow-hidden shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={formatImgUrl(item.imagenPrincipal)}
                    alt={item.nombre}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp'; }}
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center gap-[3px] overflow-hidden">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap border self-start bg-[#E0F2FE] text-[#023E8A] border-[#BAE6FD]">
                    🛏️ Alojamiento
                  </span>
                  <div className="text-[0.9rem] font-bold text-text-primary font-display">{item.nombre}</div>
                  <div className="text-[0.75rem] text-text-secondary leading-[1.4] line-clamp-2">{item.descripcion || ''}</div>
                  <div className="text-[0.7rem] text-text-muted mt-1">📍 {item.direccion}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/categoria/alojamiento" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-rojo border-2 border-rojo hover:bg-[#FFF0F1] transition-all no-underline">
              Ver más opciones de Alojamiento
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
