import React from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import { CumpeoEvent } from '@/lib/types';

interface EventsSectionProps {
  events: CumpeoEvent[];
}

export function EventsSection({ events }: EventsSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-10 w-full max-w-[1200px] mx-auto px-4" id="section-eventos">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rojo uppercase tracking-wider mb-1">
            <CalendarDays size={14} /> Calendario Tradicional
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-text-primary">
            Eventos y Fiestas Costumbristas
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Festividades religiosas, ferias artesanales y celebraciones tipicas que dan vida a Cumpeo durante el año.
          </p>
        </div>
        <Link
          href="/mapa"
          className="text-xs font-bold text-rojo hover:text-rojo-dark inline-flex items-center gap-1 self-start sm:self-auto no-underline"
        >
          <span>Ver ubicaciones en el mapa</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-rojo transition-all flex flex-col justify-between p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <CalendarDays size={12} className="text-amber-600" />
                  <span>{ev.fecha || 'Fecha por confirmar'}</span>
                </span>
                {ev.recurrente && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Clock size={10} /> Tradicion Anual
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-base text-text-primary mb-1">
                {ev.nombre}
              </h3>

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
          </div>
        ))}
      </div>
    </section>
  );
}
