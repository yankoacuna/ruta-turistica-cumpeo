'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Section, SectionHeader, type SectionTone } from './Section';
import { PlaceCard, PlaceCardItem } from './PlaceCard';
import { Editable } from '@/components/site-text';

export type CatalogItem = PlaceCardItem & { filterId?: string };

interface CatalogSectionProps {
  id: string;
  tone?: SectionTone;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  items: CatalogItem[];
  /** Cuantas tarjetas se muestran antes de pedir "ver mas" */
  initialCount?: number;
  cols?: 2 | 3 | 4;
  action?: { href: string; label: React.ReactNode };
  /** Chips de filtro por categoria (opcional) */
  filters?: Array<{ id: string; nombre: string }>;
  /** Etiqueta en plural para el boton, ej. "destinos" */
  nounPlural?: string;
}

const GRID_COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Seccion de catalogo con filtros por categoria.
 * Clave para mobile: NO renderiza el catastro completo. Muestra `initialCount`
 * tarjetas y deja el resto detras de un boton, para que la portada siga siendo
 * una portada y no un scroll infinito.
 */
export function CatalogSection({
  id,
  tone = 'paper',
  kicker,
  title,
  lead,
  items,
  initialCount = 6,
  cols = 3,
  action,
  filters,
  nounPlural = 'lugares',
}: CatalogSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');

  const filtered = useMemo(
    () => (activeFilter === 'todos' ? items : items.filter((i) => i.filterId === activeFilter)),
    [items, activeFilter]
  );

  if (items.length === 0) return null;

  const visible = expanded ? filtered : filtered.slice(0, initialCount);
  const hidden = filtered.length - visible.length;

  // Chips monocromos: el activo se marca con tinta plena, no con otro color.
  // Antes el chip activo era rojo y "Todos" era negro, dos acentos para una
  // misma funcion.
  const CHIP =
    'min-h-[40px] px-4 rounded-full text-sm font-bold transition-colors shrink-0 border-[1.5px] cursor-pointer capitalize';

  return (
    <Section id={id} tone={tone}>
      <SectionHeader kicker={kicker} title={title} lead={lead} action={action} />

      {filters && filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-px-4 px-4 pb-3 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('todos');
              setExpanded(false);
            }}
            className={`${CHIP} ${
              activeFilter === 'todos'
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-text-secondary border-border hover:border-ink'
            }`}
          >
            Todos ({items.length})
          </button>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveFilter(f.id);
                setExpanded(false);
              }}
              className={`${CHIP} ${
                activeFilter === f.id
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-text-secondary border-border hover:border-ink'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Editable
          k="home.catalogo.vacio"
          as="p"
          className="px-4 text-sm text-text-muted"
        />
      ) : (
        <div className={`px-4 grid grid-cols-1 ${GRID_COLS[cols]} gap-4 md:gap-5`}>
          {visible.map((item) => (
            <PlaceCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {(hidden > 0 || expanded) && (
        <div className="px-4 mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full sm:w-auto min-h-[48px] px-6 inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold bg-white border-[1.5px] border-border hover:border-ink text-text-primary transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} /> Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Ver los {hidden} {nounPlural} restantes
              </>
            )}
          </button>
        </div>
      )}
    </Section>
  );
}
