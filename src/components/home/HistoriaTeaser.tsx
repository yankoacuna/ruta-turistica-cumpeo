import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Editable } from '@/components/site-text';

export function HistoriaTeaser() {
  return (
    <div className="px-4 pt-0 pb-8 md:pb-12 -mt-4 md:-mt-8">
      <div className="max-w-shell mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Viñeta compacta con la ilustración */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 aspect-[4/3] rounded-xl overflow-hidden border-2 border-sol/30 shadow-comic-sm bg-surface-soft">
            <img
              src="/assets/images/condorito-amigos-historia.webp"
              alt="Condorito y sus amigos en Cumpeo"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Información y llamada a la acción */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sol/20 text-sol-dark mb-3">
              <BookOpen size={14} className="text-rojo" />
              <Editable k="home.historiaTeaser.kicker" />
            </div>

            <h3 className="font-display font-bold text-2xl md:text-3xl text-text-primary mb-3 leading-snug">
              <Editable k="home.historiaTeaser.titulo" />
            </h3>

            <Editable
              k="home.historiaTeaser.bajada"
              as="p"
              className="text-text-muted text-base leading-relaxed mb-6 max-w-xl"
              multiline
            />

            <Link
              href="/historia"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-rojo text-white hover:bg-rojo-dark transition-colors shadow-sm no-underline"
            >
              <span>Conoce la historia de Cumpeo</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
