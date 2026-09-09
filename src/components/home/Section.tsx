import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SectionProps {
  id?: string;
  /**
   * 'base'   = fondo crema del sitio, separado del bloque anterior por un hairline.
   * 'soft'   = crema mas calido, para agrupar dos secciones relacionadas.
   * 'accent' = bloque oscuro de acento, para cortar la monotonia del scroll.
   */
  tone?: 'base' | 'soft' | 'accent';
  className?: string;
  children: React.ReactNode;
}

const TONES: Record<string, string> = {
  base: 'bg-bg border-t border-border',
  soft: 'bg-surface-soft border-t border-border',
  accent: 'bg-text-primary text-white',
};

/**
 * Contenedor de seccion de portada.
 * Unifica el ritmo vertical (py-10 en mobile / py-16 en desktop) y permite
 * alternar el fondo para que el scroll no sea una masa uniforme.
 * No aplica padding horizontal: lo hacen los bloques internos, para que los
 * carruseles puedan sangrar hasta el borde de la pantalla.
 */
export function Section({ id, tone = 'base', className = '', children }: SectionProps) {
  return (
    <section
      id={id}
      className={`w-full py-10 md:py-16 ${TONES[tone]} ${className}`}
    >
      <div className="w-full max-w-[1200px] mx-auto">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  /** true cuando la seccion usa tono 'accent' (fondo oscuro) */
  inverted?: boolean;
}

/**
 * Encabezado estandar de seccion: antetitulo + titulo + bajada + enlace opcional.
 * Mobile-first: apilado, con el enlace debajo; en sm+ el enlace se alinea a la derecha.
 */
export function SectionHeader({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  action,
  inverted = false,
}: SectionHeaderProps) {
  return (
    <div className="px-4 mb-5 md:mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="min-w-0">
        <div
          className={`inline-flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wider mb-1.5 ${
            inverted ? 'text-sol' : 'text-rojo'
          }`}
        >
          <Icon size={14} className="shrink-0" /> {eyebrow}
        </div>
        <h2
          className={`font-display font-extrabold text-[1.4rem] leading-tight sm:text-3xl text-balance ${
            inverted ? 'text-white' : 'text-text-primary'
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-sm mt-1.5 leading-relaxed max-w-2xl ${
              inverted ? 'text-gray-300' : 'text-text-secondary'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={`text-xs font-bold inline-flex items-center gap-1 self-start sm:self-auto shrink-0 no-underline min-h-[44px] sm:min-h-0 ${
            inverted ? 'text-sol hover:text-sol-light' : 'text-rojo hover:text-rojo-dark'
          }`}
        >
          <span>{action.label}</span>
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
