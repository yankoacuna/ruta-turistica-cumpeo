import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation, MapPin } from 'lucide-react';
import { getDestinationByIdOrSlug, getDestinations, getCategoryEmoji, getCategoryColorClass, formatImgUrl } from '@/lib/data';

const BADGE_STYLES: Record<string, string> = {
  rojo:       'bg-[#FFE0E2] text-[#C1121F] border-[#FFA8AE]',
  sol:        'bg-[#FFF3C4] text-[#B47900] border-[#FFE07D]',
  cielo:      'bg-[#E0F2FE] text-[#023E8A] border-[#BAE6FD]',
  verde:      'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  tierra:     'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  gray:       'bg-[#EAE8E1] text-[#4A4E69] border-[#D5D3C8]',
  patrimonio: 'bg-[#EDE9FE] text-[#5B21B6] border-[#C4B5FD]',
};
const getBadgeStyle = (colorClass: string) => BADGE_STYLES[colorClass] || BADGE_STYLES.gray;

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
    <div className="pb-16">
      {/* ── HERO DETALLE ─────── */}
      <div className="relative w-full h-[50vh] min-h-[300px] max-h-[500px] overflow-hidden">
        <img
          src={formatImgUrl(destination.imagenPrincipal)}
          alt={destination.nombre}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />

        {/* Back Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center text-2xl no-underline hover:bg-rojo transition-all"
            title="Volver al inicio"
          >
            ‹
          </Link>
          <div className="flex gap-2">
            <Link
              href="/mapa"
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center no-underline hover:bg-rojo transition-all"
              title="Ver en el mapa"
            >
              🗺️
            </Link>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
          <div className="flex gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap border ${getBadgeStyle(getCategoryColorClass(destination.categoria))}`}>
              {getCategoryEmoji(destination.categoria)} {destination.categoria}
            </span>
            {destination.precio && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap border bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]">
                {destination.precio}
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-white text-3xl md:text-4xl leading-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            {destination.nombre}
          </h1>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────── */}
      <div className="w-full max-w-[1200px] mx-auto px-4 mt-6">
        <div className="flex flex-col gap-6">

          {/* Información práctica clave */}
          <div className="grid gap-4 bg-white border border-border rounded-[22px] p-5 shadow-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div>
              <div className="text-[0.75rem] uppercase text-text-muted font-bold">📍 Dirección</div>
              <div className="font-semibold mt-1 text-[0.95rem]">{destination.direccion || 'Cumpeo, Maule'}</div>
            </div>
            <div>
              <div className="text-[0.75rem] uppercase text-text-muted font-bold">⏰ Horario</div>
              <div className="font-semibold mt-1 text-[0.95rem]">{destination.horario || 'Abierto todo el día'}</div>
            </div>
            <div>
              <div className="text-[0.75rem] uppercase text-text-muted font-bold">💵 Entrada / Tarifa</div>
              <div className="font-semibold mt-1 text-[0.95rem]">{destination.precio || 'Gratuito'}</div>
            </div>
            <div>
              <div className="text-[0.75rem] uppercase text-text-muted font-bold">⏱️ Duración sugerida</div>
              <div className="font-semibold mt-1 text-[0.95rem]">{destination.duracionVisita || '45 minutos'}</div>
            </div>
          </div>

          {/* Descripcion Larga & Reseña */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm p-6">
            <h2 className="font-display font-bold text-[1.3rem] text-text-primary mb-3">📖 Reseña del Destino</h2>
            <p className="leading-[1.7] text-base text-text-primary whitespace-pre-line">
              {destination.descripcionLarga}
            </p>

            {destination.historia && (
              <div className="mt-5 pt-5 border-t border-border">
                <h3 className="font-display font-semibold text-[1.125rem] text-text-primary mb-2">🏛️ Historia en Pelotillehue</h3>
                <p className="leading-[1.7] text-text-secondary text-[0.95rem]">{destination.historia}</p>
              </div>
            )}
          </div>

          {/* Galería */}
          {destination.galeria && destination.galeria.length > 0 && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm p-6">
              <h2 className="font-display font-bold text-[1.3rem] text-text-primary mb-4">🖼️ Galería de Fotografías</h2>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {destination.galeria.map((imgUrl, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden h-[140px] bg-surface-soft">
                    <img
                      src={formatImgUrl(imgUrl)}
                      alt={`${destination.nombre} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cómo Llegar */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm p-6">
            <h2 className="font-display font-bold text-[1.3rem] text-text-primary mb-2 flex items-center gap-2">
              <Navigation size={22} /> Cómo Llegar
            </h2>
            <p className="text-text-muted text-sm mb-4">{destination.comoLlegar || 'Acceso principal por la vía pública en el centro urbano de Cumpeo, comuna de Río Claro.'}</p>

            {destination.coordenadas && (
              <div className="flex gap-3 flex-wrap">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${destination.coordenadas.lat},${destination.coordenadas.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full font-bold text-sm bg-rojo text-white shadow-rojo hover:-translate-y-0.5 hover:bg-rojo-dark transition-all no-underline"
                >
                  <Navigation size={16} /> Google Maps
                </a>
                <a
                  href={`https://waze.com/ul?ll=${destination.coordenadas.lat},${destination.coordenadas.lng}&navigate=yes`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full font-bold text-sm text-cielo border-2 border-cielo hover:bg-[#E0F2FE] transition-all no-underline"
                >
                  <MapPin size={16} /> Waze
                </a>
              </div>
            )}
          </div>

          {/* Relacionados */}
          {related.length > 0 && (
            <div className="mt-4">
              <h3 className="font-display font-bold text-[1.3rem] text-text-primary mb-3">✨ Otros atractivos en Cumpeo</h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {related.map((r) => (
                  <div key={r.id} className="bg-white border-[1.5px] border-border rounded-2xl overflow-hidden shadow-sm hover:border-rojo hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                    <div className="h-[140px] overflow-hidden">
                      <img
                        src={formatImgUrl(r.imagenPrincipal)}
                        alt={r.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-display font-bold text-text-primary text-base mb-1">{r.nombre}</h4>
                      <p className="text-text-secondary text-[0.82rem] mb-3 line-clamp-2">{r.descripcionCorta}</p>
                      <Link href={`/destino/${r.slug}`} className="inline-flex items-center justify-center w-full py-2 px-4 rounded-full font-bold text-sm text-rojo border-2 border-rojo hover:bg-[#FFF0F1] transition-all no-underline">
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
