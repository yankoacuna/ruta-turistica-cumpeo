'use client';

/**
 * Editor flotante de un texto del sitio.
 *
 * Se carga solo en modo edición (import dinámico desde SiteTextProvider), así
 * que el registro de textos con sus etiquetas y valores originales nunca entra
 * al bundle de un visitante normal.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Save, X } from 'lucide-react';
import { SITE_TEXT_DEFAULTS, SITE_TEXT_INDEX, SITE_TEXT_MAX_LENGTH } from '@/lib/siteTexts';

interface SiteTextEditorProps {
  textKey: string;
  valorActual: string;
  guardando: boolean;
  onGuardar: (valor: string) => void;
  onCerrar: () => void;
}

export function SiteTextEditor({
  textKey,
  valorActual,
  guardando,
  onGuardar,
  onCerrar,
}: SiteTextEditorProps) {
  const def = SITE_TEXT_INDEX[textKey];
  const original = SITE_TEXT_DEFAULTS[textKey] ?? '';
  const [borrador, setBorrador] = useState(valorActual);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setBorrador(valorActual);
  }, [textKey, valorActual]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [textKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  // El servidor recorta espacios al guardar: comparar así evita "guardar" algo
  // que en la práctica no cambia nada.
  const sinCambios = borrador.trim() === valorActual.trim();
  const esOriginal = borrador.trim() === original.trim();

  const guardar = () => {
    if (guardando || sinCambios) return;
    onGuardar(borrador);
    onCerrar();
  };

  const filas = def?.multiline ? 6 : 3;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl border-t-2 sm:border-2 border-ink shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Editar ${def?.label || textKey}`}
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-border">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-rojo mb-1">
              Editar texto del sitio
            </div>
            <h2 className="font-display font-bold text-lg text-text-primary leading-tight">
              {def?.label || textKey}
            </h2>
            <code className="text-[11px] text-text-muted break-all">{textKey}</code>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {def?.hint && (
            <p className="text-xs text-text-secondary bg-surface-soft border border-border rounded-lg px-3 py-2">
              {def.hint}
            </p>
          )}

          <textarea
            ref={inputRef}
            rows={filas}
            value={borrador}
            maxLength={SITE_TEXT_MAX_LENGTH}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) guardar();
              // En un campo de una línea, Enter guarda directo.
              if (e.key === 'Enter' && !def?.multiline && !e.shiftKey) {
                e.preventDefault();
                guardar();
              }
            }}
            className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-border bg-white text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all resize-y font-sans leading-relaxed"
            placeholder="Escribe el texto que verán los visitantes…"
          />

          <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
            <span>
              {borrador.length} / {SITE_TEXT_MAX_LENGTH} caracteres
            </span>
            {def?.multiline && <span>Se respetan los saltos de línea</span>}
          </div>

          {!esOriginal && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-text-secondary hover:text-text-primary">
                Ver el texto original del sitio
              </summary>
              <p className="mt-2 whitespace-pre-line text-text-muted bg-surface-soft border border-border rounded-lg px-3 py-2">
                {original}
              </p>
            </details>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-[#FAF8F5] rounded-b-2xl">
          <button
            type="button"
            onClick={() => setBorrador(original)}
            disabled={esOriginal || guardando}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-rojo hover:bg-white border border-transparent hover:border-border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} /> Volver al texto original
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-white border border-border transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || sinCambios}
              className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-rojo hover:bg-rojo-dark text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar en el sitio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
