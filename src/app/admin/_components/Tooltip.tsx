'use client';

import React from 'react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}

/**
 * Reemplazo del `title` nativo del navegador (feo, con delay inconsistente
 * entre navegadores) por un tooltip propio con la estética del CMS. Pensado
 * para envolver un único elemento interactivo (botón, ícono).
 */
export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const isTop = side === 'top';

  return (
    <span className="relative inline-flex group/tooltip">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 w-max max-w-[220px] text-center whitespace-normal rounded-lg bg-ink text-white text-[11px] font-semibold leading-snug px-2.5 py-1.5 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 ${
          isTop ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}
      >
        {label}
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-ink rotate-45 ${
            isTop ? '-bottom-1' : '-top-1'
          }`}
        />
      </span>
    </span>
  );
}
