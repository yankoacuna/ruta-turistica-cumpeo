import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDestinationByIdOrSlug, getDestinations, getCategoryEmoji, getCategoryColorClass, formatImgUrl } from '@/lib/data';

export async function generateStaticParams() {
  const dests = await getDestinations();
  return dests.map((d) => ({
    slug: d.slug || d.id,
  }));
}

export default async function DestinoDetailPage({ params }: { params: { slug: string } }) {
  const destination = await getDestinationByIdOrSlug(params.slug);

  if (!destination) {
    notFound();
  }

  const allDests = await getDestinations();
  const related = allDests.filter((d) => d.id !== destination.id && d.categoria === destination.categoria).slice(0, 3);

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* ── HERO DETALLE (CONSERVA TAMAÑO Y COBERTURA ORIGINAL) ─────── */}
      <div className="detail-hero">
        <img
          src={formatImgUrl(destination.imagenPrincipal)}
          alt={destination.nombre}
          className="detail-hero-img"
        />
        <div className="detail-hero-overlay" />

        <div className="back-header">
          <Link href="/" className="back-btn" title="Volver al inicio">
            ‹
          </Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/mapa" className="back-btn" title="Ver en el mapa">
              🗺️
            </Link>
          </div>
        </div>

        <div className="detail-hero-content">
          <div className="detail-hero-tags">
            <span className={`badge badge-${getCategoryColorClass(destination.categoria)}`}>
              {getCategoryEmoji(destination.categoria)} {destination.categoria}
            </span>
            {destination.precio && <span className="badge badge-tierra">{destination.precio}</span>}
          </div>
          <h1 className="detail-hero-title">{destination.nombre}</h1>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────── */}
      <div className="container mt-6">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Información práctica clave */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                📍 Dirección
              </div>
              <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '0.95rem' }}>{destination.direccion || 'Cumpeo, Maule'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                ⏰ Horario
              </div>
              <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '0.95rem' }}>{destination.horario || 'Abierto todo el día'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                💵 Entrada / Tarifa
              </div>
              <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '0.95rem' }}>{destination.precio || 'Gratuito'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                ⏱️ Duración sugerida
              </div>
              <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '0.95rem' }}>{destination.duracionVisita || '45 minutos'}</div>
            </div>
          </div>

          {/* Descripcion Larga & Reseña */}
          <div className="card p-6">
            <h2 className="h3 mb-3">📖 Reseña del Destino</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1rem', color: 'var(--color-text-primary)', whiteSpace: 'pre-line' }}>
              {destination.descripcionLarga}
            </p>

            {destination.historia && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                <h3 className="h4 mb-2">🏛️ Historia en Pelotillehue</h3>
                <p style={{ lineHeight: 1.7, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{destination.historia}</p>
              </div>
            )}
          </div>

          {/* Galería de imágenes (con límite de altura en tarjetas) */}
          {destination.galeria && destination.galeria.length > 0 && (
            <div className="card p-6">
              <h2 className="h3 mb-4">🖼️ Galería de Fotografías</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {destination.galeria.map((imgUrl, idx) => (
                  <div key={idx} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '140px', background: 'var(--color-surface-soft)' }}>
                    <img
                      src={formatImgUrl(imgUrl)}
                      alt={`${destination.nombre} ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cómo Llegar */}
          <div className="card p-6">
            <h2 className="h3 mb-2">🚗 Cómo Llegar</h2>
            <p className="text-muted text-sm mb-4">{destination.comoLlegar || 'Acceso principal por la vía pública en el centro urbano de Cumpeo, comuna de Río Claro.'}</p>

            {destination.coordenadas && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${destination.coordenadas.lat},${destination.coordenadas.lng}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-md"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                🗺️ Abrir Ruta en Google Maps GPS
              </a>
            )}
          </div>

          {/* Relacionados */}
          {related.length > 0 && (
            <div className="mt-4">
              <h3 className="h3 mb-3">✨ Otros atractivos en Cumpeo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {related.map((r) => (
                  <div key={r.id} className="card card-destination">
                    <div className="card-img-wrapper" style={{ height: '140px' }}>
                      <img
                        src={formatImgUrl(r.imagenPrincipal)}
                        alt={r.nombre}
                      />
                    </div>
                    <div className="card-body">
                      <h4 className="card-title mb-1" style={{ fontSize: '1rem' }}>{r.nombre}</h4>
                      <p className="card-desc mb-3" style={{ fontSize: '0.82rem' }}>{r.descripcionCorta}</p>
                      <Link href={`/destino/${r.slug}`} className="btn btn-outline btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                        Ver Detalle →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
