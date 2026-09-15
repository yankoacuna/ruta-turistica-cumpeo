'use client';

/**
 * Editor flotante de un texto del sitio.
 *
 * Se carga solo en modo edición (import dinámico desde SiteTextProvider), así
 * que el registro de textos con sus etiquetas y valores originales nunca entra
 * al bundle de un visitante normal.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Save, Upload, X } from 'lucide-react';
import { SITE_TEXT_DEFAULTS, SITE_TEXT_INDEX, SITE_TEXT_MAX_LENGTH } from '@/lib/siteTexts';

const FALLBACK_IMG = '/assets/images/placeholder.webp';

/** Subidor de imagen minimo para el editor flotante: arrastrar/elegir archivo o pegar una URL. */
function ImagenEditor({
  valor,
  onCambiar,
}: {
  valor: string;
  onCambiar: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);

  const subir = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan archivos de imagen (JPG, PNG, WebP, GIF, AVIF)');
      return;
    }
    setSubiendo(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
      onCambiar(data.url);
    } catch (err: any) {
      setError(err?.message || 'Error desconocido al subir la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl overflow-hidden border border-border bg-surface-soft h-40">
        <img
          src={valor}
          alt="Vista previa"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
      </div>

      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors px-4 py-5 flex flex-col items-center justify-center gap-2 text-center ${
          arrastrando ? 'border-rojo bg-[#FFF0F1]' : 'border-border bg-surface-soft hover:border-rojo/60'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          const file = e.dataTransfer.files[0];
          if (file) subir(file);
        }}
      >
        {subiendo ? (
          <>
            <Loader2 size={22} className="animate-spin text-rojo" />
            <span className="text-xs font-bold text-text-primary">Subiendo imagen…</span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-surface-soft text-text-primary border border-border shadow-xs hover:border-rojo hover:text-rojo transition-all cursor-pointer"
            >
              <Upload size={13} /> Elegir archivo o arrastrar aquí
            </button>
            <span className="text-[11px] text-text-muted">JPG, PNG, WebP, GIF, AVIF (máx. 5 MB)</span>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) subir(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

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
  const esImagen = def?.type === 'image';

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
              {esImagen ? 'Editar imagen del sitio' : 'Editar texto del sitio'}
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

          {esImagen ? (
            <ImagenEditor valor={borrador} onCambiar={setBorrador} />
          ) : (
            <>
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
            </>
          )}

          {!esOriginal && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-text-secondary hover:text-text-primary">
                Ver {esImagen ? 'la imagen original' : 'el texto original'} del sitio
              </summary>
              {esImagen ? (
                <img
                  src={original}
                  alt="Imagen original"
                  className="mt-2 w-full h-32 object-cover rounded-lg border border-border bg-surface-soft"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
              ) : (
                <p className="mt-2 whitespace-pre-line text-text-muted bg-surface-soft border border-border rounded-lg px-3 py-2">
                  {original}
                </p>
              )}
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
            <RotateCcw size={14} /> Volver {esImagen ? 'a la imagen original' : 'al texto original'}
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
