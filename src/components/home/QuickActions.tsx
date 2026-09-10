'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation, UtensilsCrossed, BedDouble, LifeBuoy, ChevronRight } from 'lucide-react';
import { Editable } from '@/components/site-text';

interface QuickActionsProps {
  onGPSClick: () => void;
  isLocating: boolean;
  onOpenEmergencyModal: () => void;
}

/** Fila de accion: icono en caja de tinta + etiqueta legible + chevron. */
const ROW =
  'group w-full min-h-[68px] px-3.5 py-3 flex items-center gap-3 rounded-xl bg-white border-[1.5px] border-border hover:border-ink no-underline text-left transition-all cursor-pointer';

const ICON_BOX =
  'w-10 h-10 rounded-lg bg-paper-deep text-ink flex items-center justify-center shrink-0 transition-colors group-hover:bg-ink group-hover:text-sol';

/**
 * Banda de orientacion para quien acaba de llegar (el caso real del EETT: se
 * entra escaneando el QR de una señaletica en la calle).
 *
 * Cambios respecto de la version anterior:
 * - Ya no repite "La Ruta" ni "Mapa GPS": esas dos son ahora las acciones
 *   primarias del hero, tenerlas dos veces en 200px de scroll era ruido.
 * - Cuatro tiles de 84px con texto de 10.8px pasaron a filas de 68px con
 *   etiqueta legible: se lee y se toca mejor en un telefono al sol.
 * - "Contactos" se llama "Emergencias", que es lo que realmente abre.
 */
export function QuickActions({ onGPSClick, isLocating, onOpenEmergencyModal }: QuickActionsProps) {
  return (
    <section className="w-full bg-paper-warm border-b border-border" aria-label="Orientación">
      <div className="max-w-shell mx-auto px-4 py-7 md:py-9">
        <Editable
          k="home.orientacion.titulo"
          as="h2"
          className="font-display font-bold text-lg text-text-primary mb-1"
        />
        <Editable
          k="home.orientacion.bajada"
          as="p"
          className="text-sm text-text-secondary mb-5"
          multiline
        />

        <nav aria-label="Accesos directos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button type="button" onClick={onGPSClick} disabled={isLocating} className={`${ROW} disabled:opacity-60`}>
            <span className={ICON_BOX}>
              <Navigation size={20} className={isLocating ? 'animate-spin' : ''} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k={isLocating ? 'home.orientacion.gps.buscando' : 'home.orientacion.gps.titulo'}
                className="block text-sm font-bold text-text-primary"
              />
              <Editable
                k="home.orientacion.gps.detalle"
                className="block text-xs text-text-muted mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </button>

          <Link href="#section-comer" className={ROW}>
            <span className={ICON_BOX}>
              <UtensilsCrossed size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k="home.orientacion.comer.titulo"
                className="block text-sm font-bold text-text-primary"
              />
              <Editable
                k="home.orientacion.comer.detalle"
                className="block text-xs text-text-muted mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </Link>

          <Link href="#section-dormir" className={ROW}>
            <span className={ICON_BOX}>
              <BedDouble size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k="home.orientacion.dormir.titulo"
                className="block text-sm font-bold text-text-primary"
              />
              <Editable
                k="home.orientacion.dormir.detalle"
                className="block text-xs text-text-muted mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </Link>

          <button type="button" onClick={onOpenEmergencyModal} className={ROW}>
            <span className={`${ICON_BOX} bg-rojo/10 text-rojo group-hover:bg-rojo group-hover:text-white`}>
              <LifeBuoy size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k="home.orientacion.sos.titulo"
                className="block text-sm font-bold text-text-primary"
              />
              <Editable
                k="home.orientacion.sos.detalle"
                className="block text-xs text-text-muted mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </button>
        </nav>
      </div>
    </section>
  );
}
