import React from 'react';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  /** Columnas del grid a partir de lg (en mobile siempre es carrusel) */
  cols?: 2 | 3 | 4;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * En mobile: carrusel horizontal con scroll-snap (deslizar cuesta menos que
 * scrollear metros de tarjetas apiladas).
 * En md/lg: se convierte en grilla normal.
 */
export function HorizontalScroller({ children, cols = 4, className = '' }: HorizontalScrollerProps) {
  return (
    <div
      className={`flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 px-4 pb-2 -mb-2 md:grid ${GRID_COLS[cols]} md:overflow-visible md:pb-0 md:mb-0 ${className}`}
    >
      {React.Children.map(children, (child, i) =>
        child == null ? null : (
          <div key={i} className="snap-start shrink-0 w-[80vw] max-w-[320px] md:w-auto md:max-w-none flex">
            {child}
          </div>
        )
      )}
    </div>
  );
}
