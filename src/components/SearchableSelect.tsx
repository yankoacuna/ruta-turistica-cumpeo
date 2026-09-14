'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Texto secundario, mostrado atenuado junto al label (ej. categoría). */
  description?: string;
  /** Etiqueta corta en formato "chip" (ej. el tipo de lugar). */
  badge?: string;
  /** Texto adicional (no visible) contra el que también matchea la búsqueda. */
  keywords?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Fuerza mostrar/ocultar el buscador. Por defecto se muestra solo si hay varias opciones. */
  searchable?: boolean;
  className?: string;
  /** Reemplaza por completo las clases del botón disparador (para variantes tipo "pill"). */
  triggerClassName?: string;
  id?: string;
}

const DEFAULT_TRIGGER_CLS =
  'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-left transition-all outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
  disabled,
  searchable,
  className = '',
  triggerClassName,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; openUpwards: boolean } | null>(
    null
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 7;
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!showSearch || !query.trim()) return options;
    const q = normalize(query);
    return options.filter((o) => normalize(`${o.label} ${o.description || ''} ${o.badge || ''} ${o.keywords || ''}`).includes(q));
  }, [options, query, showSearch]);

  // Reposiciona el panel (portal a document.body) cada vez que se abre, y en scroll/resize,
  // porque el modal contenedor tiene overflow-y-auto y recortaría un dropdown absoluto normal.
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const estimatedHeight = 300;
      const spaceBelow = window.innerHeight - r.bottom;
      const openUpwards = spaceBelow < estimatedHeight && r.top > spaceBelow;
      setRect({ top: openUpwards ? r.top : r.bottom, left: r.left, width: r.width, openUpwards });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = filtered.findIndex((o) => o.value === value);
    setHighlighted(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && showSearch) searchRef.current?.focus();
  }, [open, showSearch]);

  const commitSelection = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[highlighted];
      if (opt) commitSelection(opt);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={triggerClassName ?? DEFAULT_TRIGGER_CLS}
      >
        <span className={`truncate ${selected ? 'text-text-primary' : 'text-text-muted/70'}`}>
          {selected ? (
            <>
              {selected.badge && (
                <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-black/5 text-text-secondary align-middle">
                  {selected.badge}
                </span>
              )}
              {selected.label}
              {selected.description && <span className="text-text-muted"> · {selected.description}</span>}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        rect &&
        !disabled &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              top: rect.openUpwards ? undefined : rect.top + 4,
              bottom: rect.openUpwards ? window.innerHeight - rect.top + 4 : undefined,
            }}
            className="z-[9999] bg-white border border-border rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
          >
            {showSearch && (
              <div className="p-2 border-b border-border shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setHighlighted(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-border bg-surface-soft outline-none focus:border-rojo"
                  />
                </div>
              </div>
            )}
            <div role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-muted">{emptyMessage}</div>
              ) : (
                filtered.map((opt, idx) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={opt.value === value}
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => commitSelection(opt)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      idx === highlighted ? 'bg-surface-soft' : ''
                    } ${opt.value === value ? 'text-rojo font-semibold' : 'text-text-primary'}`}
                  >
                    <span className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <span className="truncate flex items-center gap-1.5">
                        {opt.badge && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-black/5 text-text-secondary">
                            {opt.badge}
                          </span>
                        )}
                        <span className="truncate">{opt.label}</span>
                      </span>
                      {opt.description && (
                        <span className="truncate text-[11px] text-text-muted font-normal">{opt.description}</span>
                      )}
                    </span>
                    {opt.value === value && <Check size={14} className="shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
