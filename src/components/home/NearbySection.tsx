'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, MapPin, ChevronRight } from 'lucide-react';
import { Destination } from '@/lib/types';
import { formatDistance, formatImgUrl } from '@/lib/data';
import { Section } from './Section';
import { Editable } from '@/components/site-text';

interface NearbySectionProps {
  nearbyList: Destination[];
  onRefresh: () => void;
}

/**
 * Resultado del GPS. Aparece inmediatamente debajo de la banda de orientacion,
 * que es donde esta el boton "Cerca de mi": la respuesta tiene que salir junto
 * al control que la dispara, no seis secciones mas abajo.
 */
export function NearbySection({ nearbyList, onRefresh }: NearbySectionProps) {
  if (!nearbyList || nearbyList.length === 0) return null;

  return (
    <Section id="section-nearby" tone="paper" className="!py-9 md:!py-12">
      <div className="px-4 mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <Editable
            k="home.cerca.kicker"
            as="div"
            className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted mb-2"
          />
          <Editable
            k="home.cerca.titulo"
            as="h2"
            className="font-display font-bold text-display-md text-text-primary"
          />
          <div className="w-11 h-1 rounded-full bg-rojo mt-3.5" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="shrink-0 min-h-[44px] px-4 text-sm font-bold text-rojo inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-rojo hover:bg-rojo hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> <Editable k="home.cerca.actualizar" />
        </button>
      </div>

      <ol className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {nearbyList.map((item, idx) => (
          <li key={item.id}>
            <Link
              href={`/destino/${item.slug}`}
              className="group h-full bg-white border-[1.5px] border-border hover:border-ink rounded-xl p-3 flex items-center gap-3.5 no-underline text-text-primary transition-colors"
            >
              <div className="relative shrink-0">
                <img
                  src={formatImgUrl(item.imagenPrincipal)}
                  alt={item.nombre}
                  loading="lazy"
                  className="w-[72px] h-[72px] rounded-lg object-cover bg-paper-deep"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                  }}
                />
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-ink text-sol text-xs font-bold flex items-center justify-center border-2 border-white">
                  {idx + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {item.categoria}
                </span>
                <div className="font-display font-bold text-base truncate group-hover:text-rojo transition-colors">
                  {item.nombre}
                </div>
                <div className="text-xs font-semibold text-text-secondary mt-0.5 flex items-center gap-1.5">
                  <MapPin size={12} className="text-rojo shrink-0" />
                  a{' '}
                  {formatDistance(
                    (item as Destination & { distanciaKm?: number }).distanciaKm || 0
                  )}
                </div>
              </div>
              <ChevronRight size={17} className="text-text-muted shrink-0" />
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}
