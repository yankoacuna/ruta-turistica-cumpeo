'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Section, SectionHeader } from './Section';
import { ServiceRow } from './ServiceRow';
import type { CatalogItem } from './CatalogSection';
import { Editable } from '@/components/site-text';

interface ServicesSectionProps {
  restaurants: CatalogItem[];
  lodging: CatalogItem[];
}

const INITIAL = 4;

/**
 * Servicios de la comuna en un solo bloque con pestañas.
 *
 * Antes eran dos secciones separadas ("Donde Comer" y "Donde Dormir"), cada
 * una con su encabezado completo y tres tarjetas con foto grande: seis modulos
 * visualmente identicos y muchisimo scroll para lo que en el fondo es una
 * guia telefonica. Unificarlas en una pestaña acorta la portada, deja claro
 * que es contenido de servicio (no aspiracional) y permite comparar.
 */
export function ServicesSection({ restaurants, lodging }: ServicesSectionProps) {
  const [tab, setTab] = useState<'comer' | 'dormir'>('comer');
  const [expanded, setExpanded] = useState(false);

  if (restaurants.length === 0 && lodging.length === 0) return null;

  // Si una de las dos listas esta vacia, arranca en la que tiene contenido.
  const activeTab = tab === 'comer' && restaurants.length === 0 ? 'dormir' : tab;
  const items = activeTab === 'comer' ? restaurants : lodging;
  const visible = expanded ? items : items.slice(0, INITIAL);
  const hidden = items.length - visible.length;

  const TAB =
    'min-h-[44px] px-4 rounded-full text-sm font-bold transition-colors cursor-pointer border-[1.5px]';

  return (
    <Section id="section-servicios" tone="warm">
      {/* Anclas heredadas: mantienen vivos los enlaces /#section-comer y
          /#section-dormir que puedan existir fuera de la portada. */}
      <div id="section-comer" className="scroll-mt-20" />
      <div id="section-dormir" className="scroll-mt-20" />

      <SectionHeader
        kicker={<Editable k="home.servicios.kicker" />}
        title={<Editable k="home.servicios.titulo" />}
        lead={<Editable k="home.servicios.lead" multiline />}
      />

      <div className="px-4">
        <div
          className="flex items-center gap-2 mb-5"
          role="tablist"
          aria-label="Tipo de servicio"
        >
          {restaurants.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'comer'}
              onClick={() => {
                setTab('comer');
                setExpanded(false);
              }}
              className={`${TAB} ${
                activeTab === 'comer'
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-text-secondary border-border hover:border-ink'
              }`}
            >
              <Editable k="home.servicios.tabComer" /> ({restaurants.length})
            </button>
          )}
          {lodging.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dormir'}
              onClick={() => {
                setTab('dormir');
                setExpanded(false);
              }}
              className={`${TAB} ${
                activeTab === 'dormir'
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-text-secondary border-border hover:border-ink'
              }`}
            >
              <Editable k="home.servicios.tabDormir" /> ({lodging.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visible.map((item) => (
            <ServiceRow key={item.id} item={item} />
          ))}
        </div>

        {(hidden > 0 || expanded) && (
          <div className="mt-5 flex justify-center">
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
                  <ChevronDown size={16} /> Ver los {hidden} restantes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
