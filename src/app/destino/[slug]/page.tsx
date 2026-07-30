import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDestinationByIdOrSlug, getDestinations, getCategoryEmoji, getCategoryColorClass } from '@/lib/data';

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
      {/* ── HEADER COVER HERO ─────── */}
      <div className="destino-hero">
        <img src={destination.imagenPrincipal || '/assets/images/placeholder.webp'} alt={destination.nombre} className="destino-hero-img" />
        <div className="destino-hero-overlay" />
        <div className="container destino-hero-content">
          <Link href="/" className="btn btn-secondary btn-sm mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            ← Volver al Inicio
          </Link>

          <div>
            <span className={`badge badge-${getCategoryColorClass(destination.categoria)} mb-2`}>
              {getCategoryEmoji(destination.categoria)} {destination.categoria}
            </span>
            <h1 className="h1 text-white">{destination.nombre}</h1>
            <p className="text-lg text-white-80 mt-2" style={{ maxWidth: '650px' }}>
              {destination.descripcionCorta}
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────── */}
      <div className="container mt-8">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Información clave en chips / cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  📍 Dirección
                </div>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{destination.direccion || 'Cumpeo, Maule'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  ⏰ Horario
                </div>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{destination.horario || 'Abierto todo el día'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  💵 Entrada / Tarifa
                </div>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{destination.precio || 'Gratuito'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  ⏱️ Duración recomendada
                </div>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{destination.duracionVisita || '45 minutos'}</div>
              </div>
            </div>

            {/* Descripcion Larga & Historia */}
            <div className="card p-6">
              <h2 className="h2 mb-4">📖 Reseña & Historia</h2>
              <p style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                {destination.descripcionLarga}
              </p>

              {destination.historia && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                  <h3 className="h3 mb-2">🏛️ Contexto Histórico de Pelotillehue</h3>
                  <p style={{ lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>{destination.historia}</p>
                </div>
              )}
            </div>

            {/* Galería de imágenes */}
            {destination.galeria && destination.galeria.length > 0 && (
              <div className="card p-6">
                <h2 className="h2 mb-4">🖼️ Galería de Fotos</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {destination.galeria.map((imgUrl, idx) => (
                    <div key={idx} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '160px' }}>
                      <img src={imgUrl} alt={`${destination.nombre} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cómo Llegar & Botón Mapa */}
            <div className="card p-6">
              <h2 className="h2 mb-3">🚗 Cómo Llegar</h2>
              <p className="text-muted mb-4">{destination.comoLlegar || 'Acceso principal por la vía pública en el centro urbano de Cumpeo, comuna de Río Claro.'}</p>

              {destination.coordenadas && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${destination.coordenadas.lat},${destination.coordenadas.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  🗺️ Abrir Ruta en Google Maps GPS
                </a>
              )}
            </div>

            {/* Relacionados */}
            {related.length > 0 && (
              <div className="mt-6">
                <h3 className="h2 mb-4">✨ Otros lugares similares en Cumpeo</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {related.map((r) => (
                    <div key={r.id} className="card card-destination">
                      <div className="card-img-wrapper">
                        <img src={r.imagenPrincipal || '/assets/images/placeholder.webp'} alt={r.nombre} />
                      </div>
                      <div className="card-body">
                        <h4 className="card-title mb-1">{r.nombre}</h4>
                        <p className="card-desc mb-3">{r.descripcionCorta}</p>
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
    </div>
  );
}
