'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { Section } from './Section';

interface MunicipalBannerProps {
  onOpenEmergencyModal: () => void;
}

/**
 * Cierre de portada: invitacion a comerciantes a sumarse al catastro comunal.
 * Antes vivia colgado al final de ServicesSection.
 */
export function MunicipalBanner({ onOpenEmergencyModal }: MunicipalBannerProps) {
  return (
    <Section tone="base">
      <div className="px-4">
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-border shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center shrink-0">
              <Store size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-text-primary text-balance">
                ¿Tienes un local gastronomico, cabaña o taller artesanal en Cumpeo?
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Acercate a la Oficina de Turismo de la Ilustre Municipalidad de Rio Claro para
                registrar tu emprendimiento en el catastro comunal oficial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEmergencyModal}
            className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl text-xs font-extrabold bg-text-primary hover:bg-black text-white transition-all shrink-0 cursor-pointer"
          >
            Contacto Municipal
          </button>
        </div>
      </div>
    </Section>
  );
}
