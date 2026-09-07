'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation, RefreshCw, MapPin } from 'lucide-react';
import { Destination } from '@/lib/types';
import { formatDistance, formatImgUrl } from '@/lib/data';

interface NearbySectionProps {
  nearbyList: Destination[];
  onRefresh: () => void;
}

export function NearbySection({ nearbyList, onRefresh }: NearbySectionProps) {
  if (!nearbyList || nearbyList.length === 0) return null;

  return (
    <section id="section-nearby" className="py-8 w-full max-w-[1200px] mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rojo uppercase tracking-wider mb-1">
            <Navigation size={14} /> Posicion GPS
          </div>
          <h2 className="font-display font-extrabold text-2xl text-text-primary">
            Destinos Cercanos a tu Ubicacion
          </h2>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs font-bold text-rojo inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0F1] border border-[#FFCCD0] hover:bg-rojo hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw size={11} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {nearbyList.map((item) => (
          <Link
            key={item.id}
            href={`/destino/${item.slug}`}
            className="bg-white border border-border rounded-2xl overflow-hidden p-3 flex items-center gap-3 hover:border-rojo hover:shadow-md transition-all no-underline text-text-primary"
          >
            <img
              src={formatImgUrl(item.imagenPrincipal)}
              alt={item.nombre}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
              }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-[0.65rem] font-bold text-rojo uppercase tracking-wide">
                {item.categoria}
              </span>
              <div className="font-bold text-sm truncate">{item.nombre}</div>
              <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <MapPin size={11} className="text-rojo shrink-0" />
                {formatDistance((item as any).distanciaKm || 0)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
