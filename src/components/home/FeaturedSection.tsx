import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, MapPin } from 'lucide-react';
import { Destination } from '@/lib/types';
import { formatImgUrl } from '@/lib/data';
import { Section, SectionHeader } from './Section';
import { Editable } from '@/components/site-text';

interface FeaturedSectionProps {
  featured: Destination[];
}

const FALLBACK_IMG = '/assets/images/placeholder.webp';

/**
 * Destacados en composicion editorial asimetrica.
 *
 * La version anterior mostraba cuatro tarjetas identicas en carrusel, lo que
 * hacia que "destacado" no significara nada: si todo tiene el mismo tamaño, no
 * hay destaque. Aca el primer destino ocupa una viñeta grande y los siguientes
 * bajan a filas compactas: eso SI es jerarquia.
 */
export function FeaturedSection({ featured }: FeaturedSectionProps) {
  if (!featured || featured.length === 0) return null;

  const [principal, ...resto] = featured;
  const secundarios = resto.slice(0, 4);

  return (
    <Section tone="paper">
      <SectionHeader
        kicker={<Editable k="home.destacados.kicker" />}
        title={<Editable k="home.destacados.titulo" />}
        lead={<Editable k="home.destacados.lead" multiline />}
        action={{ href: '/mapa', label: <Editable k="home.destacados.accion" /> }}
      />

      <div className="px-4 grid lg:grid-cols-12 gap-4 lg:gap-5">
        {/* Viñeta principal */}
        <Link
          href={`/destino/${principal.slug}`}
          className="group lg:col-span-7 relative block rounded-xl overflow-hidden border-[1.5px] border-border hover:border-ink no-underline transition-colors"
        >
          <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[420px] bg-paper-deep overflow-hidden">
            <img
              src={formatImgUrl(principal.imagenPrincipal)}
              alt={principal.nombre}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMG;
              }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sol text-ink mb-3">
              {principal.categoria}
            </span>
            <h3 className="font-display font-bold text-display-md text-white text-balance">
              {principal.nombre}
            </h3>
            <p className="text-sm text-paper-deep mt-2.5 leading-relaxed line-clamp-2 max-w-lg">
              {principal.descripcionCorta}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-sol">
              <Editable k="home.destacados.verFicha" />
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Filas secundarias */}
        {secundarios.length > 0 && (
          <ul className="lg:col-span-5 lg:self-start flex flex-col gap-3">
            {secundarios.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/destino/${d.slug}`}
                  className="group h-full bg-white border-[1.5px] border-border hover:border-ink rounded-xl p-3 flex items-center gap-3.5 no-underline transition-colors"
                >
                  <img
                    src={formatImgUrl(d.imagenPrincipal)}
                    alt={d.nombre}
                    loading="lazy"
                    className="w-[88px] h-[72px] rounded-lg object-cover bg-paper-deep shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      {d.categoria}
                    </span>
                    <h3 className="font-display font-bold text-base text-text-primary leading-snug truncate group-hover:text-rojo transition-colors">
                      {d.nombre}
                    </h3>
                    {d.direccion && (
                      <span className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{d.direccion}</span>
                      </span>
                    )}
                  </div>
                  <ChevronRight size={17} className="text-text-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
