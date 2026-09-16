'use client';

/**
 * Sección "Apariencia" del CMS: paleta de colores y tipografías del sitio.
 *
 * Cuatro colores base (el resto de la paleta se deriva solo, ver
 * src/lib/theme.ts) y dos tipografías elegidas de un catálogo curado de
 * Google Fonts. Guardar reteñir todo el sitio público y el propio panel de
 * administración, porque ambos comparten el mismo layout raíz.
 */

import React, { useState } from 'react';
import { Loader2, Palette, RotateCcw, Save } from 'lucide-react';
import { adjustLightness, isValidHex } from '@/lib/color';
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  DEFAULT_FONT_BODY,
  DEFAULT_FONT_DISPLAY,
  THEME_COLOR_DEFAULTS,
  THEME_COLOR_DEFS,
  ThemeColorKey,
  findFont,
} from '@/lib/theme';
import type { ThemeConfigRecord, ThemeSaveInput, UserRole } from '@/lib/types';
import { resetTheme, saveTheme } from '../themeActions';
import type { ToastFn, ConfirmFn } from '../_types';
import { ResultadoError, esProblemaDeSesion } from '@/lib/resultado';

interface ThemeManagerProps {
  initial: ThemeConfigRecord | null;
  role: UserRole;
  showToast: ToastFn;
  confirmAction: ConfirmFn;
  onAuthError?: () => void;
}

interface Draft {
  colorPrimario: string;
  colorAcento: string;
  colorFondo: string;
  colorTexto: string;
  fontBody: string;
  fontDisplay: string;
}

const DRAFT_COLOR_KEY: Record<ThemeColorKey, keyof Draft> = {
  primario: 'colorPrimario',
  acento: 'colorAcento',
  fondo: 'colorFondo',
  texto: 'colorTexto',
};

function toDraft(record: ThemeConfigRecord | null): Draft {
  return {
    colorPrimario: record?.colorPrimario || THEME_COLOR_DEFAULTS.primario,
    colorAcento: record?.colorAcento || THEME_COLOR_DEFAULTS.acento,
    colorFondo: record?.colorFondo || THEME_COLOR_DEFAULTS.fondo,
    colorTexto: record?.colorTexto || THEME_COLOR_DEFAULTS.texto,
    fontBody: record?.fontBody || DEFAULT_FONT_BODY,
    fontDisplay: record?.fontDisplay || DEFAULT_FONT_DISPLAY,
  };
}

// Todas las tipografías del catálogo, precargadas una sola vez para que el
// selector pueda previsualizarlas al instante sin pedirlas una por una.
const PREVIEW_FONTS_HREF = (() => {
  const params = Array.from(
    new Set([...BODY_FONTS, ...DISPLAY_FONTS].map((f) => f.googleParam))
  );
  return `https://fonts.googleapis.com/css2?${params.map((p) => `family=${p}`).join('&')}&display=swap`;
})();

function ColorField({
  def,
  value,
  onChange,
  disabled,
}: {
  def: (typeof THEME_COLOR_DEFS)[number];
  value: string;
  onChange: (hex: string) => void;
  disabled: boolean;
}) {
  const [texto, setTexto] = useState(value);
  React.useEffect(() => setTexto(value), [value]);

  const commit = (v: string) => {
    const limpio = v.trim();
    if (isValidHex(limpio)) onChange(limpio);
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-bold text-text-primary">{def.label}</span>
      </div>
      <p className="text-[11px] text-text-secondary mb-3">{def.hint}</p>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={isValidHex(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer disabled:cursor-not-allowed shrink-0"
          aria-label={`Color: ${def.label}`}
        />
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          disabled={disabled}
          placeholder="#RRGGBB"
          maxLength={7}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-[#FAF8F5] text-xs font-mono text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none disabled:opacity-60"
        />
      </div>
      <div className="flex gap-1.5 mt-2.5">
        {[adjustLightness(value, 12), value, adjustLightness(value, -16)].map((tono, i) => (
          <div
            key={i}
            className="flex-1 h-6 rounded-md border border-border/60"
            style={{ background: isValidHex(tono) ? tono : undefined }}
            title={tono}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeManager({ initial, role, showToast, confirmAction, onAuthError }: ThemeManagerProps) {
  const canEdit = role === 'ADMIN' || role === 'EDITOR';
  const [guardado, setGuardado] = useState<ThemeConfigRecord | null>(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [guardando, setGuardando] = useState(false);

  const personalizado = Boolean(
    guardado?.colorPrimario ||
      guardado?.colorAcento ||
      guardado?.colorFondo ||
      guardado?.colorTexto ||
      guardado?.fontBody ||
      guardado?.fontDisplay
  );

  /** Fallo previsto por la acción: la sesión caída cambia la pantalla, el resto avisa. */
  const avisarFallo = (res: ResultadoError) => {
    if (esProblemaDeSesion(res)) onAuthError?.();
    showToast(res.mensaje, 'error');
  };

  const manejarError = (contexto: string, error: unknown) => {
    console.error(contexto, error);
    showToast('No pudimos guardar la apariencia. Vuelve a intentarlo.', 'error');
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const input: ThemeSaveInput = { ...draft };
      const res = await saveTheme(input);
      if (!res.ok) {
        avisarFallo(res);
        return;
      }
      setGuardado(res.data);
      showToast('Apariencia actualizada en el sitio', 'success');
    } catch (error) {
      manejarError('Error inesperado al guardar la apariencia:', error);
    } finally {
      setGuardando(false);
    }
  };

  const restaurar = async () => {
    const ok = await confirmAction('¿Volver la apariencia del sitio a los valores originales?', {
      title: 'Restaurar apariencia',
      confirmLabel: 'Restaurar',
    });
    if (!ok) return;
    setGuardando(true);
    try {
      const res = await resetTheme();
      if (!res.ok) {
        avisarFallo(res);
        return;
      }
      setGuardado(null);
      setDraft(toDraft(null));
      showToast('Apariencia restaurada a los valores originales', 'info');
    } catch (error) {
      manejarError('Error inesperado al restaurar la apariencia:', error);
    } finally {
      setGuardando(false);
    }
  };

  const fontBodyOption = findFont(BODY_FONTS, draft.fontBody, DEFAULT_FONT_BODY);
  const fontDisplayOption = findFont(DISPLAY_FONTS, draft.fontDisplay, DEFAULT_FONT_DISPLAY);

  return (
    <div className="space-y-5">
      <link rel="stylesheet" href={PREVIEW_FONTS_HREF} />

      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2">
              <Palette size={20} className="text-rojo" /> Apariencia del Sitio
            </h2>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Elige el color dominante, el de acento, el fondo y el texto: el resto de la
              paleta (tonos claros y oscuros, superficies, bordes) se ajusta solo. Los
              cambios se aplican al sitio público y a este panel, porque comparten la
              misma marca.
            </p>
            {personalizado && (
              <span className="inline-block mt-2 text-[10px] font-bold text-rojo bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                Personalizado
              </span>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              {personalizado && (
                <button
                  type="button"
                  onClick={restaurar}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-rojo bg-[#FAF8F5] hover:bg-red-50 border border-border transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <RotateCcw size={14} /> Restaurar original
                </button>
              )}
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar cambios
              </button>
            </div>
          )}
        </div>

        {!canEdit && (
          <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Tu rol es de solo lectura: puedes ver la apariencia actual, pero no modificarla.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Colores */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
            Paleta de colores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEME_COLOR_DEFS.map((def) => {
              const draftKey = DRAFT_COLOR_KEY[def.key];
              return (
                <ColorField
                  key={def.key}
                  def={def}
                  value={draft[draftKey]}
                  onChange={(hex) => setDraft((prev) => ({ ...prev, [draftKey]: hex }))}
                  disabled={!canEdit || guardando}
                />
              );
            })}
          </div>
        </div>

        {/* Tipografías */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
            Tipografías
          </h3>

          <div>
            <label className="text-xs font-bold text-text-primary block mb-1.5">
              Texto (párrafos, botones, menús)
            </label>
            <select
              value={draft.fontBody}
              onChange={(e) => setDraft((prev) => ({ ...prev, fontBody: e.target.value }))}
              disabled={!canEdit || guardando}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-[#FAF8F5] text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none disabled:opacity-60"
            >
              {BODY_FONTS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <p
              className="mt-2 text-sm text-text-secondary"
              style={{ fontFamily: `'${fontBodyOption.family}', ${fontBodyOption.fallback}` }}
            >
              Cumpeo, el pueblo de Condorito en el corazón del Maule.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-text-primary block mb-1.5">
              Titulares
            </label>
            <select
              value={draft.fontDisplay}
              onChange={(e) => setDraft((prev) => ({ ...prev, fontDisplay: e.target.value }))}
              disabled={!canEdit || guardando}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-[#FAF8F5] text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none disabled:opacity-60"
            >
              {DISPLAY_FONTS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <p
              className="mt-2 text-xl font-bold text-text-primary"
              style={{ fontFamily: `'${fontDisplayOption.family}', ${fontDisplayOption.fallback}` }}
            >
              Cumpeo
            </p>
          </div>
        </div>
      </div>

      {/* Previsualización */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ background: draft.colorFondo, borderColor: adjustLightness(draft.colorFondo, -8) }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: adjustLightness(draft.colorTexto, 30) }}>
          Vista previa
        </span>
        <h4
          className="text-2xl font-black"
          style={{ color: draft.colorTexto, fontFamily: `'${fontDisplayOption.family}', ${fontDisplayOption.fallback}` }}
        >
          Bienvenido a Cumpeo
        </h4>
        <p
          className="text-sm max-w-xl"
          style={{ color: adjustLightness(draft.colorTexto, 20), fontFamily: `'${fontBodyOption.family}', ${fontBodyOption.fallback}` }}
        >
          El pueblo temático de Condorito, en el corazón del Maule. Así se vería un párrafo
          normal del sitio con la paleta y la tipografía elegidas.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: draft.colorPrimario, fontFamily: `'${fontBodyOption.family}', ${fontBodyOption.fallback}` }}
          >
            Botón principal
          </button>
          <span
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: draft.colorAcento, color: draft.colorTexto }}
          >
            Detalle destacado
          </span>
        </div>
      </div>
    </div>
  );
}
