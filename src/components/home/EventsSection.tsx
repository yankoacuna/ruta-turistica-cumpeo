import React from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react';
import { CumpeoEvent } from '@/lib/types';
import { Section, SectionHeader } from './Section';
import { HorizontalScroller } from './HorizontalScroller';

interface EventsSectionProps {
  events: CumpeoEvent[];
}

export function EventsSection({ events }: EventsSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <Section id="section-eventos" tone="soft">
      <SectionHeader
        eyebrow="Calendario Tradicional"
        icon={CalendarDays}
        title="Eventos y Fiestas Costumbristas"
        subtitle="Festividades religiosas, ferias artesanales y celebraciones tipicas de Cumpeo."
        action={{ href: '/mapa', label: 'Ver en el mapa' }}
      />

      <HorizontalScroller cols={3}>
        {events.slice(0, 6).map((ev) => (
          <article
            key={ev.id}
            className="w-full bg-white border border-border rounded-2xl shadow-sm hover:border-rojo hover:shadow-md transition-all flex flex-col justify-between p-5"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <CalendarDays size={12} className="text-amber-600" />
                  <span>{ev.fecha || 'Fecha por confirmar'}</span>
                </span>
                {ev.recurrente && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Clock size={10} /> Tradicion Anual
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-base text-text-primary mb-1">{ev.nombre}</h3>

              {ev.direccion && (
                <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
                  <MapPin size={11} className="text-rojo shrink-0" />
                  <span className="truncate">{ev.direccion}</span>
                </div>
              )}

              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                {ev.descripcion}
              </p>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="capitalize font-semibold text-text-muted text-[11px]">
                {ev.tipo.replace(/-/g, ' ')}
              </span>
              <Link
                href="/mapa"
                className="font-bold text-rojo hover:text-rojo-dark inline-flex items-center gap-1 no-underline text-xs"
              >
                <span>Ubicacion</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </article>
        ))}
      </HorizontalScroller>
    </Section>
  );
}
