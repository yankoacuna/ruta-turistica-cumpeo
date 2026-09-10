'use client';

/**
 * Sección "Textos del Sitio" del CMS.
 *
 * Es la vista de respaldo de la edición en vivo: lista todos los textos
 * editables agrupados por página y bloque, marca los que fueron modificados,
 * muestra quién los cambió y cuándo, y permite volver al texto original o a
 * cualquier versión anterior.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Type,
} from 'lucide-react';
import type { SiteTextRecord, SiteTextRevisionRecord, UserRole } from '@/lib/types';
import {
  SITE_TEXT_DEFAULTS,
  SITE_TEXT_GROUPS,
  SITE_TEXT_MAX_LENGTH,
  siteTextGroupsByPage,
  type SiteTextDef,
} from '@/lib/siteTexts';
import {
  getSiteTextRevisions,
  resetSiteText,
  restoreSiteTextRevision,
  saveSiteTexts,
} from '../siteTextActions';
import type { ToastFn } from '../_types';

interface SiteTextsManagerProps {
  /** Textos modificados que llegaron del servidor. */
  overrides: SiteTextRecord[];
  role: UserRole;
  showToast: ToastFn;
  onAuthError?: () => void;
}

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ACCION_LABEL: Record<string, string> = {
  editar: 'Editado',
  restaurar: 'Restaurado',
  original: 'Valor original',
};

function formatearAccion(accion: string): string {
  return ACCION_LABEL[accion] || accion;
}

export function SiteTextsManager({
  overrides,
  role,
  showToast,
  onAuthError,
}: SiteTextsManagerProps) {
  const canEdit = role === 'ADMIN' || role === 'EDITOR';

  // Mapa clave -> registro guardado (solo los textos modificados).
  const [guardados, setGuardados] = useState<Record<string, SiteTextRecord>>(() =>
    Object.fromEntries(overrides.map((o) => [o.key, o]))
  );
  // Borradores locales sin guardar.
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [abiertos, setAbiertos] = useState<string[]>([SITE_TEXT_GROUPS[0]?.id].filter(Boolean) as string[]);
  const [busqueda, setBusqueda] = useState('');
  const [historial, setHistorial] = useState<{
    key: string;
    items: SiteTextRevisionRecord[];
  } | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const paginas = useMemo(() => siteTextGroupsByPage(), []);

  const valorVigente = (def: SiteTextDef) =>
    guardados[def.key]?.value ?? SITE_TEXT_DEFAULTS[def.key] ?? '';

  const valorEnPantalla = (def: SiteTextDef) =>
    borradores[def.key] ?? valorVigente(def);

  const pendientes = Object.entries(borradores).filter(
    ([key, valor]) => valor.trim() !== (guardados[key]?.value ?? SITE_TEXT_DEFAULTS[key] ?? '').trim()
  );

  const coincide = (def: SiteTextDef) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      def.label.toLowerCase().includes(q) ||
      def.key.toLowerCase().includes(q) ||
      valorVigente(def).toLowerCase().includes(q)
    );
  };

  const manejarError = (error: any) => {
    const msg = error?.message || 'Ocurrió un error al guardar';
    if (/no autorizado|sesión|sesion/i.test(msg) && onAuthError) onAuthError();
    showToast(msg, 'error');
  };

  const guardarPendientes = async () => {
    if (pendientes.length === 0) return;
    setGuardando(true);
    try {
      const resultados = await saveSiteTexts(
        pendientes.map(([key, value]) => ({ key, value }))
      );
      setGuardados((prev) => {
        const copia = { ...prev };
        resultados.forEach((r) => {
          if (r.record) copia[r.key] = r.record;
          else delete copia[r.key];
        });
        return copia;
      });
      setBorradores({});
      showToast(
        `${resultados.length} ${resultados.length === 1 ? 'texto' : 'textos'} actualizados en el sitio`,
        'success'
      );
    } catch (error) {
      manejarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const restaurarOriginal = async (def: SiteTextDef) => {
    if (!confirm(`¿Volver "${def.label}" al texto original del sitio?`)) return;
    setGuardando(true);
    try {
      await resetSiteText(def.key);
      setGuardados((prev) => {
        const copia = { ...prev };
        delete copia[def.key];
        return copia;
      });
      setBorradores((prev) => {
        const copia = { ...prev };
        delete copia[def.key];
        return copia;
      });
      showToast('Texto restaurado al original', 'info');
    } catch (error) {
      manejarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const verHistorial = async (key: string) => {
    if (historial?.key === key) {
      setHistorial(null);
      return;
    }
    setCargandoHistorial(true);
    try {
      const items = await getSiteTextRevisions(key);
      setHistorial({ key, items });
      if (items.length === 0) showToast('Este texto todavía no tiene cambios registrados', 'info');
    } catch (error) {
      manejarError(error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const restaurarVersion = async (revision: SiteTextRevisionRecord) => {
    if (!confirm('¿Dejar vigente esta versión anterior del texto?')) return;
    setGuardando(true);
    try {
      const res = await restoreSiteTextRevision(revision.id);
      setGuardados((prev) => {
        const copia = { ...prev };
        if (res.record) copia[res.key] = res.record;
        else delete copia[res.key];
        return copia;
      });
      setBorradores((prev) => {
        const copia = { ...prev };
        delete copia[res.key];
        return copia;
      });
      showToast('Versión restaurada', 'success');
      setHistorial(null);
    } catch (error) {
      manejarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const modificados = Object.keys(guardados).length;

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2">
              <Type size={20} className="text-rojo" /> Textos del Sitio
            </h2>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Los títulos, bajadas y avisos de las páginas públicas. Puedes cambiarlos aquí o
              directamente sobre el sitio con el botón de abajo, que abre la portada en modo
              edición. Cada cambio queda registrado con tu nombre y se puede revertir.
            </p>
            <div className="flex items-center gap-3 mt-2.5 text-[11px] font-semibold">
              <span className="text-text-muted">
                {Object.keys(SITE_TEXT_DEFAULTS).length} textos editables
              </span>
              <span className="text-rojo">{modificados} modificados</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <Link
              href="/?edit=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-ink hover:bg-black text-white no-underline transition-colors whitespace-nowrap"
            >
              <Pencil size={14} /> Editar textos en el sitio
              <ExternalLink size={12} className="opacity-70" />
            </Link>
            {canEdit && (
              <button
                type="button"
                onClick={guardarPendientes}
                disabled={pendientes.length === 0 || guardando}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {guardando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Guardar {pendientes.length > 0 ? `(${pendientes.length})` : 'cambios'}
              </button>
            )}
          </div>
        </div>

        {!canEdit && (
          <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Tu rol es de solo lectura: puedes revisar los textos y su historial, pero no
            modificarlos.
          </p>
        )}

        <div className="mt-4 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar un texto por su contenido o nombre…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-[#FAF8F5] text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grupos por página */}
      {paginas.map(({ pagina, grupos }) => {
        const gruposVisibles = grupos.filter((g) => g.items.some(coincide));
        if (gruposVisibles.length === 0) return null;

        return (
          <div key={pagina} className="space-y-2.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted px-1">
              {pagina}
            </h3>

            {gruposVisibles.map((grupo) => {
              const abierto = abiertos.includes(grupo.id) || busqueda.trim().length > 0;
              const items = grupo.items.filter(coincide);
              const cambiadosEnGrupo = items.filter((i) => guardados[i.key]).length;

              return (
                <div
                  key={grupo.id}
                  className="bg-white rounded-2xl border border-border overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setAbiertos((prev) =>
                        prev.includes(grupo.id)
                          ? prev.filter((id) => id !== grupo.id)
                          : [...prev, grupo.id]
                      )
                    }
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {abierto ? (
                        <ChevronDown size={16} className="text-text-muted shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-text-muted shrink-0" />
                      )}
                      <span className="font-bold text-sm text-text-primary truncate">
                        {grupo.label}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted bg-surface-soft border border-border rounded-full px-2 py-0.5 shrink-0">
                        {items.length}
                      </span>
                      {cambiadosEnGrupo > 0 && (
                        <span className="text-[10px] font-bold text-rojo bg-red-50 border border-red-200 rounded-full px-2 py-0.5 shrink-0">
                          {cambiadosEnGrupo} editados
                        </span>
                      )}
                    </div>
                    <Link
                      href={`${grupo.path}?edit=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-text-muted hover:text-rojo no-underline shrink-0"
                      title="Ver este bloque en el sitio, en modo edición"
                    >
                      Ver en el sitio <ExternalLink size={11} />
                    </Link>
                  </button>

                  {abierto && (
                    <div className="border-t border-border divide-y divide-border">
                      {items.map((def) => {
                        const guardado = guardados[def.key];
                        const enPantalla = valorEnPantalla(def);
                        const tieneBorrador =
                          borradores[def.key] !== undefined &&
                          borradores[def.key].trim() !== valorVigente(def).trim();
                        const esHistorialAbierto = historial?.key === def.key;

                        return (
                          <div key={def.key} className="p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-text-primary">
                                  {def.label}
                                </span>
                                {guardado && (
                                  <span className="ml-2 text-[10px] font-bold text-rojo bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
                                    modificado
                                  </span>
                                )}
                                {tieneBorrador && (
                                  <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                                    sin guardar
                                  </span>
                                )}
                                {role === 'ADMIN' && (
                                  <code
                                    className="block text-[10px] text-text-muted mt-0.5 break-all"
                                    title="Clave técnica interna (solo visible para administradores)"
                                  >
                                    {def.key}
                                  </code>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => verHistorial(def.key)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
                                  title="Ver el historial de cambios"
                                >
                                  {cargandoHistorial && esHistorialAbierto ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : (
                                    <History size={11} />
                                  )}
                                  Historial
                                </button>
                                {canEdit && guardado && (
                                  <button
                                    type="button"
                                    onClick={() => restaurarOriginal(def)}
                                    disabled={guardando}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-rojo hover:bg-red-50 transition-colors disabled:opacity-40"
                                    title="Volver al texto original del sitio"
                                  >
                                    <RotateCcw size={11} /> Original
                                  </button>
                                )}
                              </div>
                            </div>

                            {def.hint && (
                              <p className="text-[11px] text-text-secondary mb-2">{def.hint}</p>
                            )}

                            <textarea
                              rows={def.multiline ? 4 : 2}
                              value={enPantalla}
                              maxLength={SITE_TEXT_MAX_LENGTH}
                              readOnly={!canEdit}
                              onChange={(e) =>
                                setBorradores((prev) => ({ ...prev, [def.key]: e.target.value }))
                              }
                              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-text-primary outline-none transition-all resize-y leading-relaxed ${
                                canEdit
                                  ? 'border-border bg-white focus:border-rojo focus:ring-2 focus:ring-rojo/10'
                                  : 'border-border bg-surface-soft cursor-default'
                              } ${tieneBorrador ? 'border-amber-300 bg-amber-50/40' : ''}`}
                            />

                            {guardado && (
                              <p className="text-[10px] text-text-muted mt-1.5">
                                Última edición: {guardado.updatedByNombre || 'desconocido'}
                                {guardado.updatedByEmail ? ` (${guardado.updatedByEmail})` : ''} ·{' '}
                                {formatearFecha(guardado.updatedAt)}
                              </p>
                            )}

                            {esHistorialAbierto && historial.items.length > 0 && (
                              <div className="mt-3 rounded-xl border border-border bg-[#FAF8F5] overflow-hidden">
                                <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-text-muted border-b border-border">
                                  Historial de cambios
                                </div>
                                <ul className="divide-y divide-border">
                                  {historial.items.map((rev) => (
                                    <li key={rev.id} className="px-3 py-2.5">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="text-[11px] font-bold text-text-primary">
                                            {rev.autorNombre || 'Desconocido'}
                                            <span className="ml-1.5 font-semibold text-text-muted">
                                              {formatearFecha(rev.createdAt)}
                                            </span>
                                            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted bg-white border border-border rounded px-1 py-0.5">
                                              {formatearAccion(rev.accion)}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-text-secondary mt-1 whitespace-pre-line line-clamp-3">
                                            {rev.valorNuevo}
                                          </p>
                                        </div>
                                        {canEdit && (
                                          <button
                                            type="button"
                                            onClick={() => restaurarVersion(rev)}
                                            disabled={guardando}
                                            className="text-[10px] font-bold text-rojo hover:underline shrink-0 disabled:opacity-40"
                                          >
                                            Restaurar
                                          </button>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
