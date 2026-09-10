import React from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Repeat, ArrowRight } from 'lucide-react';
import { CumpeoEvent } from '@/lib/types';
import { Section, SectionHeader } from './Section';
import { Editable } from '@/components/site-text';

interface EventsSectionProps {
  events: CumpeoEvent[];
}

/**
 * Calendario comunal en formato agenda.
 *
 * Antes era otro carrusel de tarjetas blancas (el cuarto de la portada) y
 * ademas usaba colores crudos de Tailwind (amber-50, emerald-50) que no
 * existen en el sistema, sumando dos hues mas al desorden. Una agenda es una
 * lista con fechas: leerla en filas es mas rapido y le da a la seccion una
 * forma propia dentro de la pagina.
 */
export function EventsSection({ events }: EventsSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <Section id="section-eventos" tone="warm">
      <SectionHeader
        kicker={<Editable k="home.eventos.kicker" />}
        title={<Editable k="home.eventos.titulo" />}
        lead={<Editable k="home.eventos.lead" multiline />}
        action={{ href: '/mapa', label: <Editable k="home.eventos.accion" /> }}
      />

      <div className="px-4">
        <ol className="bg-white border-[1.5px] border-border rounded-xl divide-y divide-border overflow-hidden">
          {events.slice(0, 6).map((ev) => (
            <li
              key={ev.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-paper-warm transition-colors"
            >
              {/* Bloque de fecha: el ancla visual de una agenda. */}
              <div className="sm:w-[132px] shrink-0">
                <div className="inline-flex sm:flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 px-3 py-2 rounded-lg bg-sol/15 border border-sol/40 w-full">
                  <CalendarDays size={15} className="text-tierra-dark shrink-0" />
                  {ev.fecha ? (
                    <span className="font-display font-bold text-sm text-text-primary leading-tight">
                      {ev.fecha}
                    </span>
                  ) : (
                    <Editable
                      k="home.eventos.sinFecha"
                      className="font-display font-bold text-sm text-text-primary leading-tight"
                    />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-base text-text-primary leading-snug">
                    {ev.nombre}
                  </h3>
                  {ev.recurrente && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted border border-border rounded-full px-2 py-0.5">
                      <Repeat size={11} /> Anual
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {ev.tipo.replace(/-/g, ' ')}
                  </span>
                  {ev.direccion && (
                    <span className="text-xs text-text-muted flex items-center gap-1.5 min-w-0">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{ev.direccion}</span>
                    </span>
                  )}
                </div>

                {ev.descripcion && (
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed line-clamp-2">
                    {ev.descripcion}
                  </p>
                )}
              </div>

              <Link
                href="/mapa"
                className="shrink-0 self-start sm:self-center min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-full text-sm font-bold text-text-primary bg-paper-warm border-[1.5px] border-border hover:border-ink no-underline transition-colors"
              >
                <Editable k="home.eventos.ubicacion" /> <ArrowRight size={14} />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
