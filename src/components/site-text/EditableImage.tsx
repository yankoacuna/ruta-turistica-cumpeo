'use client';

/**
 * Una imagen del sitio que el equipo municipal puede reemplazar desde la
 * página, igual que <Editable /> pero para fotos en vez de texto.
 *
 * Pensado para imagenes fijas que no dependen de ningun registro del
 * catastro (la foto de fondo del hero, el plano ilustrado por defecto):
 * las que sí dependen de una ficha (un destino, un alojamiento) ya se editan
 * donde vive esa ficha y se pasan acá como `override`, que desactiva la
 * edición en el sitio para esa instancia puntual.
 *
 * Fuera del modo edición no cambia nada: es la misma etiqueta <img> de
 * siempre. En modo edición se agrega un boton superpuesto que abre el mismo
 * editor flotante que los textos.
 */

import React from 'react';
import { ImagePlus } from 'lucide-react';
import { useSiteText } from './SiteTextProvider';

interface EditableImageProps {
  /** Clave del registro de textos (src/lib/siteTexts.ts), con type: 'image'. */
  k: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Imagen de respaldo si la que corresponde no carga. */
  onErrorSrc?: string;
  /**
   * Si viene, reemplaza el valor editable (p. ej. la foto de un registro del
   * catastro): la imagen deja de ser editable en esta instancia puntual.
   */
  override?: string | null;
  /** Clases del botón superpuesto en modo edición. Por defecto cubre todo el marco. */
  overlayClassName?: string;
}

const FALLBACK_IMG = '/assets/images/placeholder.webp';

export function EditableImage({
  k,
  alt,
  className,
  loading,
  fetchPriority,
  onErrorSrc,
  override,
  overlayClassName,
}: EditableImageProps) {
  const { get, editing, openEditor, saving } = useSiteText();
  const usaOverride = Boolean(override);
  const src = override || get(k);
  const guardando = saving.includes(k);

  const onError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = onErrorSrc || FALLBACK_IMG;
  };

  if (!editing || usaOverride) {
    return <img src={src} alt={alt} className={className} loading={loading} fetchPriority={fetchPriority} decoding="async" onError={onError} />;
  }

  const abrir = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openEditor(k);
  };

  // El clic va directo en la <img>, no en un botón superpuesto: un overlay
  // aparte depende de que el padre tenga la posición y el z-index exactos
  // para no quedar tapado (p. ej. por el degradado del hero), lo que fallaba
  // en produccion. La imagen misma siempre puede recibir el clic.
  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onError={onError}
        onClick={abrir}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') abrir(e);
        }}
        title="Haz clic para cambiar esta imagen"
        aria-label={`Cambiar la imagen: ${alt}`}
        style={{
          cursor: 'pointer',
          pointerEvents: 'auto',
          outline: '2px dashed rgba(230, 57, 70, 0.85)',
          outlineOffset: '-3px',
          opacity: guardando ? 0.7 : 1,
        }}
      />
      {/* Insignia decorativa: no intercepta clics (pointerEvents: 'none'), asi
          que nunca puede tapar el clic sobre la imagen. Siempre visible en vez
          de aparecer solo al pasar el mouse, porque ':hover' no se activa
          sobre un elemento con pointer-events desactivado. */}
      <span
        className={
          overlayClassName ||
          'absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/70 text-white text-xs font-bold shadow-lg'
        }
        style={{ pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <ImagePlus size={14} /> {guardando ? 'Guardando…' : 'Cambiar imagen'}
      </span>
    </>
  );
}
