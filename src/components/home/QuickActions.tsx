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

/** Fila de accion: icono en caja + etiqueta legible + chevron, en clave oscura. */
const ROW =
  'group w-full min-h-[68px] px-3.5 py-3 flex items-center gap-3 rounded-xl bg-white/10 border-[1.5px] border-white/20 hover:border-sol hover:bg-white/15 no-underline text-left transition-all cursor-pointer';

const ICON_BOX =
  'w-10 h-10 rounded-lg bg-white/10 text-sol flex items-center justify-center shrink-0 transition-colors group-hover:bg-sol group-hover:text-ink';

/**
 * Banda de orientacion para quien acaba de llegar (el caso real del EETT: se
 * entra escaneando el QR de una señaletica en la calle).
 *
 * Va inmediatamente debajo de RutaShowcase, en la misma clave oscura: antes
 * era una banda clara entre dos bloques oscuros (Hero y RutaShowcase), lo que
 * se sentia como un parpadeo blanco-negro-blanco al bajar. Ahora Hero(oscuro)
 * -> RutaShowcase(oscuro) -> Orientacion(oscura) es una sola transicion.
 */
export function QuickActions({ onGPSClick, isLocating, onOpenEmergencyModal }: QuickActionsProps) {
  return (
    <section className="w-full bg-ink border-t border-white/10" aria-label="Orientación">
      <div className="max-w-shell mx-auto px-4 py-7 md:py-9">
        <Editable
          k="home.orientacion.titulo"
          as="h2"
          className="font-display font-bold text-lg text-white mb-1"
        />
        <Editable
          k="home.orientacion.bajada"
          as="p"
          className="text-sm text-paper-deep/80 mb-5"
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
                className="block text-sm font-bold text-white"
              />
              <Editable
                k="home.orientacion.gps.detalle"
                className="block text-xs text-paper-deep/70 mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-paper-deep/60 shrink-0" />
          </button>

          <Link href="#section-comer" className={ROW}>
            <span className={ICON_BOX}>
              <UtensilsCrossed size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k="home.orientacion.comer.titulo"
                className="block text-sm font-bold text-white"
              />
              <Editable
                k="home.orientacion.comer.detalle"
                className="block text-xs text-paper-deep/70 mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-paper-deep/60 shrink-0" />
          </Link>

          <Link href="#section-dormir" className={ROW}>
            <span className={ICON_BOX}>
              <BedDouble size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k="home.orientacion.dormir.titulo"
                className="block text-sm font-bold text-white"
              />
              <Editable
                k="home.orientacion.dormir.detalle"
                className="block text-xs text-paper-deep/70 mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-paper-deep/60 shrink-0" />
          </Link>

          <button type="button" onClick={onOpenEmergencyModal} className={ROW}>
            <span className="w-10 h-10 rounded-lg bg-rojo/20 text-rojo-light flex items-center justify-center shrink-0 transition-colors group-hover:bg-rojo group-hover:text-white">
              <LifeBuoy size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <Editable
                k="home.orientacion.sos.titulo"
                className="block text-sm font-bold text-white"
              />
              <Editable
                k="home.orientacion.sos.detalle"
                className="block text-xs text-paper-deep/70 mt-0.5"
              />
            </span>
            <ChevronRight size={16} className="text-paper-deep/60 shrink-0" />
          </button>
        </nav>
      </div>
    </section>
  );
}
