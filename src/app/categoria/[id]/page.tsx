import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getConfig,
  getAllPOIs,
  getCategoryColorClass,
  getCategoryEmoji,
  formatDistance,
  formatImgUrl,
} from '@/lib/data';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = await getConfig();
  const cat = config.categorias?.find((c: any) => c.id === params.id);
  
  if (!cat) {
    return { title: 'Categoría no encontrada' };
  }
  
  return {
    title: `${cat.emoji} ${cat.nombre} en Cumpeo — Cumpeo Turismo`,
    description: `Explora todos los lugares de ${cat.nombre} en el pueblo temático de Condorito, Región del Maule.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const config = await getConfig();
  const category = config.categorias?.find((c: any) => c.id === params.id);
  
  if (!category) {
    notFound();
  }

  const allPOIs = await getAllPOIs();
  const categoryPOIs = allPOIs.filter((poi) => poi.categoria === params.id);

  return (
    <div>
      {/* ── HERO SECTION ─────── */}
      <section className="hero" aria-label={`Categoría ${category.nombre}`}>
        <img
          className="hero-img"
          src={formatImgUrl(category.imagen)}
          alt={category.nombre}
          style={{ opacity: 0.8 }}
        />
        {/* Gradiente oscuro sutil para que la imagen se vea bien y el texto resalte */}
        <div className="hero-overlay" style={{ background: `linear-gradient(to bottom, rgba(30, 30, 36, 0.2), rgba(30, 30, 36, 0.9))` }}></div>

        <div className="hero-content" style={{ paddingTop: '100px' }}>
          <h1 className="hero-title font-display">
            {category.nombre}
          </h1>

          <p className="hero-desc">
            Explora todos los lugares y actividades de la categoría {category.nombre} en el pueblo de Condorito.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
             <Link 
               href="/" 
               className="btn" 
               style={{ 
                 padding: '8px 24px', 
                 fontSize: '0.9rem', 
                 backgroundColor: category.color || 'var(--color-sol)',
                 color: category.color === '#E8A020' || category.color === 'var(--color-sol)' ? '#1E1E24' : '#FFF',
                 border: 'none',
                 boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
               }}>
               ← Volver al inicio
             </Link>
          </div>
        </div>
      </section>

      <main className="page-content container" style={{ position: 'relative', zIndex: 10, paddingBottom: '80px', paddingTop: '24px' }}>
        
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="section-title">Resultados ({categoryPOIs.length})</h2>
          </div>
        </div>

        {categoryPOIs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)' }}>
            <span style={{ fontSize: '4rem', opacity: 0.5 }}>{category.emoji}</span>
            <h3 style={{ marginTop: '16px', fontSize: '1.2rem', fontWeight: 600 }}>Pronto más lugares</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Estamos actualizando los destinos de esta categoría.</p>
          </div>
        ) : (
          <div className="destinations-grid-container" role="list">
            {categoryPOIs.map((poi) => (
              <article
                key={poi.id}
                className="destination-card animate-fade-in-up"
                role="button"
                tabIndex={0}
              >
                <div className="card-img-wrap">
                  <img
                    className="card-img"
                    src={formatImgUrl(poi.imagenPrincipal)}
                    alt={poi.nombre}
                  />
                  <div className="card-badge-top">
                    <span className={`badge badge-${getCategoryColorClass(poi.categoria)}`}>
                      {getCategoryEmoji(poi.categoria)} {poi.categoria}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-category">
                    {getCategoryEmoji(poi.categoria)} {poi.categoria.charAt(0).toUpperCase() + poi.categoria.slice(1)}
                  </div>
                  <h3 className="card-title">
                    {/* Hacemos Link fallback dependiendo de si es destino normal o no. Para ahora, todos se redirigen a /destino/id, ya que en esta app se asume que todos son resolubles por ID/Slug */}
                    <Link href={poi.tipo === 'restaurante' || poi.tipo === 'alojamiento' ? `/destino/${poi.id}` : `/destino/${poi.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {poi.nombre}
                    </Link>
                  </h3>
                  <p className="card-desc line-clamp-2">{poi.descripcionCorta}</p>
                  <div className="card-footer">
                    <div className="card-meta">
                      {poi.precio ? <span>· {poi.precio}</span> : null}
                    </div>
                    {poi.rating && <div className="card-rating">⭐ {poi.rating.toFixed(1)}</div>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
