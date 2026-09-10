import React, { useState } from 'react';
import { Compass, ArrowUp, ArrowDown, Trash2, Plus, Clock, Gauge } from 'lucide-react';
import { TourRoute, POI } from '@/lib/types';
import { slugify } from '@/lib/slug';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';

interface RutaModalProps {
  editing: Partial<TourRoute>;
  availablePois: POI[];
  onChange: (updated: Partial<TourRoute>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function RutaModal({
  editing,
  availablePois,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: RutaModalProps) {
  const [selectedPoiToAdd, setSelectedPoiToAdd] = useState<string>('');
  const set = (patch: Partial<TourRoute>) => onChange({ ...editing, ...patch });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slugify(editing.nombre || '') || editing.slug || 'ruta';
    onChange({ ...editing, slug: finalSlug });
    onSubmit(e);
  };

  const poiMap = new Map(availablePois.map((p) => [p.id, p]));
  const currentPoiIds: string[] = editing.poiIds || [];

  // Paradas no agregadas todavía para el selector
  const unselectedPois = availablePois.filter((p) => !currentPoiIds.includes(p.id));

  const handleAddStop = () => {
    if (!selectedPoiToAdd) return;
    set({ poiIds: [...currentPoiIds, selectedPoiToAdd] });
    setSelectedPoiToAdd('');
  };

  const handleRemoveStop = (poiId: string) => {
    set({ poiIds: currentPoiIds.filter((id) => id !== poiId) });
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPoiIds.length) return;
    const nextPoiIds = [...currentPoiIds];
    const temp = nextPoiIds[index];
    nextPoiIds[index] = nextPoiIds[targetIndex];
    nextPoiIds[targetIndex] = temp;
    set({ poiIds: nextPoiIds });
  };

  return (
    <ModalWrapper
      title={editing.id ? `Configurar: ${editing.nombre || 'Ruta'}` : 'Crear Nueva Ruta Turística'}
      onClose={onClose}
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
        {/* Nombre del circuito */}
        <div id="tour-ruta-nombre">
          <Field label="Nombre del Circuito / Ruta" required>
            <input
              required
              className={inputCls}
              placeholder="Ej: La Ruta Oficial de Condorito"
              value={editing.nombre || ''}
              onChange={(e) => {
                const nombre = e.target.value;
                set({ nombre, slug: slugify(nombre) });
              }}
            />
          </Field>
        </div>

        {/* Descripción */}
        <div id="tour-ruta-desc">
          <Field label="Descripción de la Ruta" required>
            <textarea
              required
              rows={3}
              className={textareaCls}
              placeholder="Describe el objetivo turístico, paisaje, atractivo cultural o gastronómico..."
              value={editing.descripcion || ''}
              onChange={(e) => set({ descripcion: e.target.value })}
            />
          </Field>
        </div>

        {/* Métricas y Color */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Color Distintivo">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                value={editing.color || '#E63946'}
                onChange={(e) => set({ color: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="#E63946"
                value={editing.color || '#E63946'}
                onChange={(e) => set({ color: e.target.value })}
              />
            </div>
          </Field>

          <Field label="Duración Estimada" hint="Ej: 2 a 3 horas">
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className={inputCls + ' pl-8'}
                placeholder="2 a 3 horas"
                value={editing.duracionEstimada || ''}
                onChange={(e) => set({ duracionEstimada: e.target.value })}
              />
            </div>
          </Field>

          <Field label="Distancia (Km)">
            <div className="relative">
              <Gauge size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.1"
                className={inputCls + ' pl-8'}
                placeholder="7.5"
                value={editing.distanciaKm ?? ''}
                onChange={(e) => set({ distanciaKm: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </Field>
        </div>

        {/* ── SECCIÓN DE PARADAS CONFIGURABLES (STOPS) ─────── */}
        <div id="tour-ruta-pois" className="p-4 bg-surface-soft border-2 border-dashed border-border rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="font-display font-extrabold text-sm text-text-primary flex items-center gap-1.5">
                <Compass size={16} className="text-rojo" /> Paradas del Circuito ({currentPoiIds.length} paradas configuradas)
              </h4>
              <p className="text-xs text-text-muted">
                Define el orden exacto en que los turistas recorrerán cada hito, restaurante o escultura.
              </p>
            </div>
          </div>

          {/* Lista de paradas actuales */}
          {currentPoiIds.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted bg-white rounded-xl border border-border">
              Aún no hay paradas asignadas a este circuito. Agrega la primera parada abajo.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {currentPoiIds.map((id, index) => {
                const poi = poiMap.get(id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-border shadow-xs hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-rojo text-white font-black text-xs flex items-center justify-center shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-text-primary truncate">
                          {poi ? poi.nombre : id}
                        </div>
                        <div className="text-[0.65rem] text-text-muted flex items-center gap-1">
                          <span className="capitalize">{poi?.tipo || 'Lugar'}</span>
                          {poi?.categoria && <span> - {poi.categoria}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveStop(index, 'up')}
                        className="p-1 rounded hover:bg-surface-soft text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Subir orden"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === currentPoiIds.length - 1}
                        onClick={() => handleMoveStop(index, 'down')}
                        className="p-1 rounded hover:bg-surface-soft text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Bajar orden"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(id)}
                        className="p-1 rounded hover:bg-red-50 text-red-600 ml-1"
                        title="Quitar parada de la ruta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selector para añadir nueva parada */}
          <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row items-center gap-2">
            <select
              className={selectCls + ' text-xs flex-1'}
              value={selectedPoiToAdd}
              onChange={(e) => setSelectedPoiToAdd(e.target.value)}
            >
              <option value="">Seleccionar lugar o hito para agregar como parada…</option>
              {unselectedPois.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.tipo.toUpperCase()}] {p.nombre} ({p.categoria})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedPoiToAdd}
              onClick={handleAddStop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E1E24] hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={14} /> Agregar Parada
            </button>
          </div>
        </div>

        {/* Opciones de publicación */}
        <div className="flex flex-wrap gap-6 pt-2 border-t border-border">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-text-primary">
            <input
              type="checkbox"
              className="rounded text-rojo focus:ring-rojo accent-rojo"
              checked={editing.destacada ?? false}
              onChange={(e) => set({ destacada: e.target.checked })}
            />
            <span>Ruta Destacada (Aparece como principal en el portal)</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-text-primary">
            <input
              type="checkbox"
              className="rounded text-rojo focus:ring-rojo accent-rojo"
              checked={editing.activo ?? true}
              onChange={(e) => set({ activo: e.target.checked })}
            />
            <span>Ruta Activa / Visible al público</span>
          </label>
        </div>

        <div id="tour-ruta-actions">
          <ModalActions isPending={isPending} onClose={onClose} />
        </div>
      </form>
    </ModalWrapper>
  );
}
