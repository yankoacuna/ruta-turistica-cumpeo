'use client';

/**
 * Un texto del sitio que el equipo municipal puede editar desde la página.
 *
 * Uso:
 *   <Editable k="home.hero.bajada" as="p" className="text-base" multiline />
 *
 * Fuera del modo edición no agrega nada: renderiza el mismo texto que antes,
 * en la misma etiqueta y con las mismas clases. En modo edición dibuja un
 * contorno punteado y, al hacer clic, abre el editor flotante.
 *
 * El valor por defecto NO se pasa acá: vive en src/lib/siteTexts.ts, que es lo
 * que permite listar y restaurar los textos desde el CMS.
 */

import React from 'react';
import { useSiteText } from './SiteTextProvider';

type EditableTag =
  | 'span'
  | 'p'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'strong'
  | 'em'
  | 'li'
  | 'dt'
  | 'dd'
  | 'label'
  | 'blockquote';

interface EditableProps {
  /** Clave del registro de textos (src/lib/siteTexts.ts). */
  k: string;
  /** Etiqueta HTML a renderizar. Por defecto <span>, que no altera el layout. */
  as?: EditableTag;
  className?: string;
  /** Respeta los saltos de línea que escriba el editor. */
  multiline?: boolean;
}

const OUTLINE_STYLE: React.CSSProperties = {
  outline: '2px dashed rgba(230, 57, 70, 0.7)',
  outlineOffset: '2px',
  borderRadius: '3px',
  cursor: 'text',
  // Sin esto, un texto largo dentro de un flex se recorta al entrar el
  // contorno; el editor necesita ver la frase completa.
  display: 'inline',
};

export function Editable({ k, as = 'span', className, multiline }: EditableProps) {
  const { get, editing, openEditor, saving } = useSiteText();
  const valor = get(k);
  const guardando = saving.includes(k);

  const clases = [className, multiline ? 'whitespace-pre-line' : null]
    .filter(Boolean)
    .join(' ');

  if (!editing) {
    return React.createElement(as, clases ? { className: clases } : {}, valor);
  }

  const abrir = (e: React.MouseEvent | React.KeyboardEvent) => {
    // Estos textos viven dentro de enlaces y botones: hay que cancelar la
    // navegación antes de abrir el editor.
    e.preventDefault();
    e.stopPropagation();
    openEditor(k);
  };

  const disparador = (
    <span
      role="button"
      tabIndex={0}
      title="Haz clic para editar este texto"
      aria-label={`Editar el texto: ${valor}`}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') abrir(e);
      }}
      style={{ ...OUTLINE_STYLE, opacity: guardando ? 0.55 : 1 }}
    >
      {valor}
    </span>
  );

  return React.createElement(as, clases ? { className: clases } : {}, disparador);
}
