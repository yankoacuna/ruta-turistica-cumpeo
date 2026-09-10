import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * 'paper' = fondo crema del sitio (con grano de imprenta).
 * 'warm'  = crema mas claro, para agrupar secciones relacionadas.
 * 'ink'   = viñeta oscura de acento, corta la monotonia del scroll.
 * Se mantienen los alias base/soft/accent para no romper llamadas previas.
 */
export type SectionTone = 'paper' | 'warm' | 'ink' | 'base' | 'soft' | 'accent';

interface SectionProps {
  id?: string;
  tone?: SectionTone;
  className?: string;
  children: React.ReactNode;
}

const TONES: Record<string, string> = {
  paper: 'bg-bg bg-paper-grain',
  base: 'bg-bg bg-paper-grain',
  warm: 'bg-paper-warm border-y border-border',
  soft: 'bg-paper-warm border-y border-border',
  ink: 'bg-ink text-white',
  accent: 'bg-ink text-white',
};

/**
 * Contenedor de seccion de portada. Unifica el ritmo vertical y alterna el
 * fondo para que el scroll no sea una masa uniforme de tarjetas blancas.
 * No aplica padding horizontal: lo hacen los bloques internos, para que los
 * carruseles puedan sangrar hasta el borde de la pantalla.
 */
export function Section({ id, tone = 'paper', className = '', children }: SectionProps) {
  return (
    <section id={id} className={`w-full py-12 md:py-20 ${TONES[tone]} ${className}`}>
      <div className="w-full max-w-shell mx-auto">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  /** Antetitulo corto. Monocromo a proposito: el rojo se reserva para acciones. */
  kicker?: React.ReactNode;
  title: React.ReactNode;
  /** Bajada. Una linea util, no relleno descriptivo. */
  lead?: React.ReactNode;
  action?: { href: string; label: React.ReactNode };
  /** true cuando la seccion usa tono 'ink' (fondo oscuro) */
  inverted?: boolean;
}

/**
 * Encabezado de seccion. A diferencia de la version anterior no lleva icono
 * de color ni antetitulo rojo: repetido en cinco secciones, ese patron hacia
 * que ninguna destacara. Aca el peso lo carga el titulo display y una regla
 * de tinta; el unico elemento en rojo es el enlace de accion.
 */
export function SectionHeader({
  kicker,
  title,
  lead,
  action,
  inverted = false,
}: SectionHeaderProps) {
  return (
    <div className="px-4 mb-7 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
      <div className="min-w-0">
        {kicker && (
          <div
            className={`text-xs font-bold uppercase tracking-[0.16em] mb-2.5 ${
              inverted ? 'text-sol' : 'text-text-muted'
            }`}
          >
            {kicker}
          </div>
        )}
        <h2
          className={`font-display font-bold text-display-md text-balance ${
            inverted ? 'text-white' : 'text-text-primary'
          }`}
        >
          {title}
        </h2>
        <div
          className={`w-11 h-1 rounded-full mt-3.5 ${inverted ? 'bg-sol' : 'bg-rojo'}`}
          aria-hidden="true"
        />
        {lead && (
          <p
            className={`text-sm mt-4 leading-relaxed max-w-xl ${
              inverted ? 'text-paper-deep' : 'text-text-secondary'
            }`}
          >
            {lead}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={`shrink-0 self-start sm:self-auto min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-full text-sm font-bold no-underline transition-all ${
            inverted
              ? 'text-ink bg-sol hover:bg-sol-light'
              : 'text-rojo border-[1.5px] border-rojo hover:bg-rojo hover:text-white'
          }`}
        >
          <span>{action.label}</span>
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
