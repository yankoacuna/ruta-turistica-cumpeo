'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ArrowRight, LifeBuoy } from 'lucide-react';
import { Section } from './Section';
import { Editable } from '@/components/site-text';

interface MunicipalBannerProps {
  onOpenEmergencyModal: () => void;
}

/**
 * Cierre de portada: invitacion a comerciantes a sumarse al catastro comunal.
 *
 * Dos correcciones respecto de la version anterior:
 * - El unico boton decia "Contacto Municipal" pero abria el modal de
 *   emergencias. Ahora son dos acciones con etiquetas honestas.
 * - Era una tarjeta blanca mas, indistinguible del resto. Ahora es un
 *   call-out con borde de tinta y sombra dura: se lee como aviso oficial.
 */
export function MunicipalBanner({ onOpenEmergencyModal }: MunicipalBannerProps) {
  return (
    <Section tone="paper">
      <div className="px-4">
        <div className="relative overflow-hidden rounded-xl bg-sol/15 border-2 border-ink shadow-comic p-5 sm:p-7">
          <div
            className="absolute inset-0 bg-halftone opacity-40 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-ink text-sol flex items-center justify-center shrink-0">
                <Store size={22} />
              </div>
              <div className="min-w-0">
                <Editable
                  k="home.municipal.kicker"
                  className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted"
                />
                <Editable
                  k="home.municipal.titulo"
                  as="h2"
                  className="font-display font-bold text-lg sm:text-xl text-text-primary text-balance mt-1"
                />
                <Editable
                  k="home.municipal.texto"
                  as="p"
                  className="text-sm text-text-secondary mt-2 leading-relaxed max-w-2xl"
                  multiline
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Link
                href="/contacto"
                className="min-h-[48px] px-5 inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold bg-ink hover:bg-ink-soft text-white no-underline transition-colors whitespace-nowrap"
              >
                <Editable k="home.municipal.ctaRegistrar" /> <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                onClick={onOpenEmergencyModal}
                className="min-h-[48px] px-5 inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold bg-white border-[1.5px] border-ink text-text-primary hover:bg-paper-warm transition-colors cursor-pointer whitespace-nowrap"
              >
                <LifeBuoy size={16} /> <Editable k="home.municipal.ctaEmergencias" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
