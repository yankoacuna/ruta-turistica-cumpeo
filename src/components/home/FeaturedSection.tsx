import React from 'react';
import Link from 'next/link';
import { Camera, MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import { Destination } from '@/lib/types';
import { formatImgUrl, getCategoryColorClass } from '@/lib/data';
import { getBadgeStyle } from './badgeStyles';

interface FeaturedSectionProps {
  featured: Destination[];
}

export function FeaturedSection({ featured }: FeaturedSectionProps) {
  if (!featured || featured.length === 0) return null;

  return (
    <section className="py-8 w-full max-w-[1200px] mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rojo uppercase tracking-wider mb-1">
            <Camera size={14} /> Galeria Patrimonial
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-text-primary">
            Destinos Destacados de Cumpeo
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Los atractivos mas emblematicos del pueblo tematico de Condorito.
          </p>
        </div>
        <Link
          href="/mapa"
          className="text-xs font-bold text-rojo hover:text-rojo-dark inline-flex items-center gap-1 self-start sm:self-auto no-underline"
        >
          <span>Ver todos en el mapa</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {featured.slice(0, 8).map((d) => (
          <article
            key={d.id}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-rojo transition-all flex flex-col group"
          >
            <div className="relative aspect-[4/3] bg-surface-soft overflow-hidden">
              <img
                src={formatImgUrl(d.imagenPrincipal)}
                alt={d.nombre}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                }}
              />
              <div className="absolute top-2.5 left-2.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wide border ${getBadgeStyle(
                    getCategoryColorClass(d.categoria)
                  )}`}
                >
                  {d.categoria}
                </span>
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1 justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-text-primary leading-tight">
                  {d.nombre}
                </h3>
                {d.direccion && (
                  <div className="text-[0.7rem] text-text-muted mt-1 flex items-center gap-1">
                    <MapPin size={10} className="text-rojo shrink-0" />
                    <span className="truncate">{d.direccion}</span>
                  </div>
                )}
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                  {d.descripcionCorta}
                </p>
              </div>
              <Link
                href={`/destino/${d.slug}`}
                className="text-xs font-bold text-rojo inline-flex items-center gap-1 pt-2 border-t border-border no-underline hover:gap-2 transition-all"
              >
                Ver ficha completa <ArrowRight size={12} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
