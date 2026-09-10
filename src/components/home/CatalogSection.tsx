'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Section, SectionHeader } from './Section';
import { PlaceCard, PlaceCardItem } from './PlaceCard';

export type CatalogItem = PlaceCardItem & { filterId?: string };

interface CatalogSectionProps {
  id: string;
  tone?: 'base' | 'soft' | 'accent';
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  items: CatalogItem[];
  /** Cuantas tarjetas se muestran antes de pedir "ver mas" */
  initialCount?: number;
  cols?: 2 | 3 | 4;
  action?: { href: string; label: string };
  /** Chips de filtro por categoria (opcional) */
  filters?: Array<{ id: string; nombre: string }>;
  /** Etiqueta en singular/plural para el boton, ej. ["restaurante", "restaurantes"] */
  nounPlural?: string;
}

const GRID_COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Seccion de catalogo (gastronomia, alojamientos, destinos).
 * Clave para mobile: NO renderiza el catastro completo. Muestra `initialCount`
 * tarjetas y deja el resto detras de un boton, para que la portada siga siendo
 * una portada y no un scroll infinito.
 */
export function CatalogSection({
  id,
  tone = 'base',
  eyebrow,
  icon,
  title,
  subtitle,
  items,
  initialCount = 3,
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

  return (
    <Section id={id} tone={tone}>
      <SectionHeader eyebrow={eyebrow} icon={icon} title={title} subtitle={subtitle} action={action} />

      {filters && filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-px-4 px-4 pb-3 mb-4">
          <button
            onClick={() => {
              setActiveFilter('todos');
              setExpanded(false);
            }}
            className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeFilter === 'todos'
                ? 'bg-text-primary text-white'
                : 'bg-white text-text-secondary border border-border'
            }`}
          >
            Todos ({items.length})
          </button>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFilter(f.id);
                setExpanded(false);
              }}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold transition-all shrink-0 capitalize ${
                activeFilter === f.id
                  ? 'bg-rojo text-white shadow-sm'
                  : 'bg-white text-text-secondary border border-border'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="px-4 text-sm text-text-muted">No hay resultados en esta categoria por ahora.</p>
      ) : (
        <div className={`px-4 grid grid-cols-1 ${GRID_COLS[cols]} gap-4 md:gap-5`}>
          {visible.map((item) => (
            <PlaceCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {(hidden > 0 || expanded) && (
        <div className="px-4 mt-5 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full sm:w-auto min-h-[48px] px-6 inline-flex items-center justify-center gap-2 rounded-full text-sm font-extrabold bg-white border-2 border-border hover:border-rojo hover:text-rojo text-text-primary transition-all"
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
