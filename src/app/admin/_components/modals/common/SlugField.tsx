'use client';

import React, { useState } from 'react';
import { Globe, Sparkles, Pencil } from 'lucide-react';
import { slugify } from '@/lib/slug';
import { inputCls } from '../../Field';

interface SlugFieldProps {
  slug: string;
  baseName?: string;
  basePath: string; // Ej: "cumpeo.cl/destino/" o "cumpeo.cl/ruta?slug="
  onChange: (slug: string) => void;
  isEditing?: boolean;
  helpText?: string;
}

export function SlugField({
  slug,
  baseName = '',
  basePath,
  onChange,
  isEditing = false,
  helpText = 'Este es el enlace directo con el que los visitantes verán esta ficha en internet.',
}: SlugFieldProps) {
  const autoSlug = slugify(baseName);
  const [isCustomizingSlug, setIsCustomizingSlug] = useState<boolean>(() => {
    if (!isEditing) return false;
    return Boolean(slug && slug !== autoSlug);
  });

  const currentSlug = slug || autoSlug;

  const handleToggleCustomize = () => {
    if (isCustomizingSlug) {
      setIsCustomizingSlug(false);
      if (baseName) {
        onChange(slugify(baseName));
      }
    } else {
      setIsCustomizingSlug(true);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-surface-soft border border-border flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
          <Globe size={13} className="text-rojo" />
          Dirección Web Pública (Enlace)
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCustomizingSlug
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isCustomizingSlug ? 'Personalizado' : 'Automático'}
          </span>
          <button
            type="button"
            onClick={handleToggleCustomize}
            className="text-[11px] text-text-muted hover:text-rojo font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title={
              isCustomizingSlug
                ? 'Volver a generar la dirección automáticamente según el nombre'
                : 'Modificar manualmente el enlace de la página'
            }
          >
            {isCustomizingSlug ? (
              <>
                <Sparkles size={12} /> Regenerar desde nombre
              </>
            ) : (
              <>
                <Pencil size={12} /> Personalizar enlace
              </>
            )}
          </button>
        </div>
      </div>

      {isCustomizingSlug ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <span className="text-xs text-text-muted font-mono pl-3 pointer-events-none select-none shrink-0">
              {basePath}
            </span>
            <input
              className={`${inputCls} font-mono text-xs`}
              placeholder="enlace-personalizado"
              value={slug || ''}
              onChange={(e) => onChange(slugify(e.target.value))}
              autoFocus
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-border/80 text-xs font-mono text-text-muted overflow-hidden">
          <div className="truncate">
            {basePath}
            <strong className="text-rojo font-semibold">
              {currentSlug || 'nombre-del-registro'}
            </strong>
          </div>
          <span className="text-[10px] text-text-muted hidden sm:inline shrink-0 ml-2">
            Generado automáticamente
          </span>
        </div>
      )}

      <span className="text-[11px] text-text-muted">{helpText}</span>
    </div>
  );
}
