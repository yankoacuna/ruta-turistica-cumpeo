'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getConfig,
  getDestinations,
  getFeaturedDestinations,
  getAccommodations,
  getRestaurants,
  sortByDistance,
  formatDistance,
  getCategoryEmoji,
  getCategoryColorClass,
  formatImgUrl,
} from '@/lib/data';
import { Destination, Accommodation, Restaurant, AppConfig } from '@/lib/types';
import { useToast } from '@/components/Toast';

export default function HomePage() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [featured, setFeatured] = useState<Destination[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyList, setNearbyList] = useState<Destination[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasGPS, setHasGPS] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cfg, dests, feat, accomm, rests] = await Promise.all([
          getConfig(),
          getDestinations(),
          getFeaturedDestinations(),
          getAccommodations(),
          getRestaurants(),
        ]);
        setConfig(cfg);
        setCategories(cfg.categorias || []);
        setDestinations(dests);
        setFilteredDestinations(dests);
        setFeatured(feat);
        setAccommodations(accomm);
        setRestaurants(rests);

        const storedFavs = JSON.parse(localStorage.getItem('fav_destinos') || '[]');
        setFavorites(storedFavs);
      } catch (err) {
        console.error('Error cargando datos de inicio:', err);
      }
    }
    loadData();
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
      showToast('❤️ Guardado en tus favoritos', 'success');
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
    showToast('📡 Obteniendo tu posición GPS...', 'info');

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
        showToast('📍 Destinos más cercanos actualizados con tu GPS', 'success');
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
      {/* ── HERO SECTION CON IMAGEN DE FONDO ─────── */}
      <section className="hero" aria-label="Bienvenida a Cumpeo">
        <img
          className="hero-img"
          src="/assets/images/hero-cumpeo.webp"
          alt="Paisaje rural de Cumpeo, Región del Maule"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
          }}
        />
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-badge">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img
                src="/assets/images/condorito-oficial.png"
                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                alt="Condorito"
              />
              ¡Bienvenidos a Pelotillehue Real!
            </span>
          </div>

          <h1 className="hero-title font-display">
            Cumpeo,<br />
            <span>el Pueblo de Condorito</span>
          </h1>

          <p className="hero-desc">
            Recorre el único pueblo real de la historieta chilena más famosa del mundo. Murales, estatuas, gastronomía y patrimonio maulino.
          </p>

          {/* Buscador Integrado */}
          <div className="search-bar-wrapper">
            <div className="search-bar" role="search">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                className="search-input"
                placeholder="Buscar atracciones, restaurantes, viñedos en Cumpeo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  {searchResults.map((d) => (
                    <Link
                      key={d.id}
                      href={`/destino/${d.slug}`}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--color-border)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{getCategoryEmoji(d.categoria)}</span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{d.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{d.categoria}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-3" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link href="/mapa" className="btn btn-primary btn-lg">
              🗺️ Mapa GPS Condorito
            </Link>
            <a href="#section-nearby" onClick={handleGPSLocation} className="btn btn-secondary btn-lg">
              📍 Cerca de mí
            </a>
          </div>
        </div>
      </section>

      <main className="page-content" id="main-content">
        {/* ── CERCA DE TI (Visible solo con GPS) ─────── */}
        {hasGPS && (
          <>
            <section className="section container" id="section-nearby" aria-label="Destinos cercanos a tu ubicación">
              <div className="section-header">
                <div>
                  <h2 className="section-title">📍 Cerca de ti</h2>
                  <div className="section-subtitle">Tus lugares más próximos en Cumpeo</div>
                </div>
                <button className="section-link" onClick={handleGPSLocation} aria-label="Actualizar ubicación">
                  Actualizar 🔄
                </button>
              </div>

              <div id="nearby-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {nearbyList.map((item) => (
                  <article key={item.id} className="card-horizontal">
                    <Link href={`/destino/${item.slug}`} style={{ display: 'flex', width: '100%', textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ width: '130px', minWidth: '130px', minHeight: '110px', background: 'var(--color-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          className="card-h-img"
                          src={formatImgUrl(item.imagenPrincipal)}
                          alt={item.nombre}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                          }}
                        />
                      </div>
                      <div className="card-h-body">
                        <span className={`badge badge-${getCategoryColorClass(item.categoria)}`} style={{ fontSize: '0.6rem', padding: '2px 8px', marginBottom: '4px', alignSelf: 'flex-start' }}>
                          {getCategoryEmoji(item.categoria)} {item.categoria}
                        </span>
                        <div className="card-h-title">{item.nombre}</div>
                        <div className="card-h-subtitle line-clamp-2">{item.descripcionCorta || ''}</div>
                        <div className="card-h-meta">
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>📍 {formatDistance((item as any).distanciaKm || 0)}</span>
                          {item.precio && <span className="text-muted" style={{ fontSize: '0.7rem' }}>· {item.precio}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-3)' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>›</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
            <div className="divider"></div>
          </>
        )}

        {/* ── CATEGORÍAS GRID ─────── */}
        <section className="section container" aria-label="Categorías de interés">
          <div className="section-header">
            <div>
              <h2 className="section-title">✨ Categorías</h2>
              <div className="section-subtitle">Explora Cumpeo según tus intereses turísticos</div>
            </div>
            <Link href="/mapa" className="section-link">
              Ver en mapa →
            </Link>
          </div>

          <div className="categories-grid" role="navigation" aria-label="Categorías turísticas">
            {categories.map((cat) => (
              <Link
                href={`/categoria/${cat.id}`}
                key={cat.id}
                className="category-card"
                style={{ backgroundImage: `url(${cat.imagen || '/assets/images/placeholder.webp'})`, textDecoration: 'none' }}
              >
                <div className="category-card-overlay"></div>
                <div className="category-card-content">
                  <h3 className="category-card-title">{cat.nombre}</h3>
                  <button className="category-card-btn" tabIndex={-1}>{cat.botonTexto || 'VER'}</button>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="divider"></div>

        {/* ── DESTACADOS ─────── */}
        <section className="section container" aria-label="Destinos destacados">
          <div className="section-header">
            <div>
              <h2 className="section-title">⭐ Imperdibles de Cumpeo</h2>
              <div className="section-subtitle">Los lugares más icónicos que debes visitar</div>
            </div>
            <Link href="/mapa" className="section-link">
              Ver mapa completo →
            </Link>
          </div>

          <div className="horizontal-scroll-container">
            {featured.map((item) => (
              <article
                key={item.id}
                className="card-compact"
                role="button"
                tabIndex={0}
              >
                <Link href={`/destino/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card-img-wrap">
                    <img
                      className="card-img"
                      src={formatImgUrl(item.imagenPrincipal)}
                      alt={item.nombre}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <div className="card-badge-top">
                      <span className={`badge badge-${getCategoryColorClass(item.categoria)}`} style={{ fontSize: '0.55rem', padding: '2px 6px' }}>
                        {getCategoryEmoji(item.categoria)}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-title">{item.nombre}</div>
                    {item.precio && <div className="text-muted text-xs">{item.precio}</div>}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>




        {/* ── GASTRONOMÍA MAULINA ─────── */}
        <section className="section container" id="section-gastronomia" aria-label="Restaurantes y gastronomía">
          <div className="section-header">
            <div>
              <h2 className="section-title">🍽️ Gastronomía Típica</h2>
              <div className="section-subtitle">Donde comer y disfrutar los sabores del Maule</div>
            </div>
            <span className="text-muted text-sm">{restaurants.length} locales</span>
          </div>

          <div className="horizontal-scroll-container" role="list">
            {restaurants.map((item) => (
              <article key={item.id} className="card-horizontal">
                <div style={{ width: '130px', minWidth: '130px', minHeight: '110px', background: 'var(--color-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    className="card-h-img"
                    src={formatImgUrl(item.imagenPrincipal)}
                    alt={item.nombre}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                    }}
                  />
                </div>
                <div className="card-h-body">
                  <span className="badge badge-rojo" style={{ fontSize: '0.6rem', padding: '2px 8px', marginBottom: '4px', alignSelf: 'flex-start' }}>
                    🍽️ Gastronomía
                  </span>
                  <div className="card-h-title">{item.nombre}</div>
                  <div className="card-h-subtitle line-clamp-2">{item.descripcion || ''}</div>
                  <div className="card-h-meta">
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>📍 {item.direccion}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/categoria/gastronomia" className="btn btn-outline" style={{ display: 'inline-block', padding: '12px 32px' }}>
              Ver más opciones de Gastronomía
            </Link>
          </div>
        </section>

        <div className="divider"></div>

        {/* ── ALOJAMIENTOS ─────── */}
        <section className="section container" id="section-alojamientos" aria-label="Alojamientos en Cumpeo">
          <div className="section-header">
            <div>
              <h2 className="section-title">🛏️ Alojamientos</h2>
              <div className="section-subtitle">Hospedajes y cabañas para descansar</div>
            </div>
            <span className="text-muted text-sm">{accommodations.length} opciones</span>
          </div>

          <div className="horizontal-scroll-container" role="list">
            {accommodations.map((item) => (
              <article key={item.id} className="card-horizontal">
                <div style={{ width: '130px', minWidth: '130px', minHeight: '110px', background: 'var(--color-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    className="card-h-img"
                    src={formatImgUrl(item.imagenPrincipal)}
                    alt={item.nombre}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                    }}
                  />
                </div>
                <div className="card-h-body">
                  <span className="badge badge-cielo" style={{ fontSize: '0.6rem', padding: '2px 8px', marginBottom: '4px', alignSelf: 'flex-start' }}>
                    🛏️ Alojamiento
                  </span>
                  <div className="card-h-title">{item.nombre}</div>
                  <div className="card-h-subtitle line-clamp-2">{item.descripcion || ''}</div>
                  <div className="card-h-meta">
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>📍 {item.direccion}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/categoria/alojamiento" className="btn btn-outline" style={{ display: 'inline-block', padding: '12px 32px' }}>
              Ver más opciones de Alojamiento
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
