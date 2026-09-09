'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Map, Navigation, LifeBuoy } from 'lucide-react';

interface QuickActionsProps {
  onGPSClick: () => void;
  isLocating: boolean;
  onOpenEmergencyModal: () => void;
}

const TILE =
  'flex flex-col items-center justify-center gap-1.5 min-h-[84px] rounded-2xl border transition-all no-underline text-center px-1 active:scale-[0.97]';

/**
 * Accesos directos bajo el hero. Saca los tres botones que antes se apilaban
 * dentro del hero y competian con el titular; en mobile son 4 objetivos
 * tactiles grandes y parejos en una sola pantalla.
 */
export function QuickActions({ onGPSClick, isLocating, onOpenEmergencyModal }: QuickActionsProps) {
  return (
    <nav
      aria-label="Accesos directos"
      className="w-full max-w-[1200px] mx-auto px-4 -mt-8 relative z-20"
    >
      <div className="grid grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-3xl border border-border shadow-lg">
        <Link href="/ruta" className={`${TILE} bg-rojo border-rojo text-white hover:bg-rojo-dark`}>
          <Compass size={22} />
          <span className="text-[0.68rem] sm:text-xs font-extrabold leading-tight">La Ruta</span>
        </Link>

        <Link
          href="/mapa"
          className={`${TILE} bg-white border-border text-text-primary hover:border-rojo hover:text-rojo`}
        >
          <Map size={22} className="text-cielo" />
          <span className="text-[0.68rem] sm:text-xs font-extrabold leading-tight">Mapa GPS</span>
        </Link>

        <button
          type="button"
          onClick={onGPSClick}
          disabled={isLocating}
          className={`${TILE} bg-white border-border text-text-primary hover:border-rojo hover:text-rojo disabled:opacity-60 cursor-pointer`}
        >
          <Navigation size={22} className={`text-verde ${isLocating ? 'animate-spin' : ''}`} />
          <span className="text-[0.68rem] sm:text-xs font-extrabold leading-tight">
            {isLocating ? 'Buscando...' : 'Cerca de mi'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenEmergencyModal}
          className={`${TILE} bg-white border-border text-text-primary hover:border-rojo hover:text-rojo cursor-pointer`}
        >
          <LifeBuoy size={22} className="text-tierra" />
          <span className="text-[0.68rem] sm:text-xs font-extrabold leading-tight">Contactos</span>
        </button>
      </div>
    </nav>
  );
}
