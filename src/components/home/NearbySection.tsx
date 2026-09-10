'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation, RefreshCw, MapPin } from 'lucide-react';
import { Destination } from '@/lib/types';
import { formatDistance, formatImgUrl } from '@/lib/data';
import { Section } from './Section';

interface NearbySectionProps {
  nearbyList: Destination[];
  onRefresh: () => void;
}

export function NearbySection({ nearbyList, onRefresh }: NearbySectionProps) {
  if (!nearbyList || nearbyList.length === 0) return null;

  return (
    <Section id="section-nearby" tone="soft">
      <div className="px-4 mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[0.7rem] font-extrabold text-rojo uppercase tracking-wider mb-1.5">
            <Navigation size={14} /> Posicion GPS
          </div>
          <h2 className="font-display font-extrabold text-[1.4rem] sm:text-3xl leading-tight text-text-primary">
            Cerca de tu ubicacion
          </h2>
        </div>
        <button
          onClick={onRefresh}
          className="shrink-0 min-h-[44px] px-4 text-xs font-bold text-rojo inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F1] border border-[#FFCCD0] hover:bg-rojo hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      <ol className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {nearbyList.map((item, idx) => (
          <li key={item.id}>
            <Link
              href={`/destino/${item.slug}`}
              className="h-full bg-white border border-border rounded-2xl overflow-hidden p-3 flex items-center gap-3 hover:border-rojo hover:shadow-md transition-all no-underline text-text-primary"
            >
              <div className="relative shrink-0">
                <img
                  src={formatImgUrl(item.imagenPrincipal)}
                  alt={item.nombre}
                  loading="lazy"
                  className="w-16 h-16 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                  }}
                />
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rojo text-white text-[0.6rem] font-black flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[0.65rem] font-bold text-rojo uppercase tracking-wide">
                  {item.categoria}
                </span>
                <div className="font-bold text-sm truncate">{item.nombre}</div>
                <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                  <MapPin size={11} className="text-rojo shrink-0" />
                  {formatDistance((item as Destination & { distanciaKm?: number }).distanciaKm || 0)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}
