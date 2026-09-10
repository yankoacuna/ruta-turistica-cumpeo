import React from 'react';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { CumpeoEvent } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import { CoordinatesPicker, CommaSeparatedField, MediaFields, DireccionField } from './common';

interface EventoModalProps {
  editing: Partial<CumpeoEvent>;
  onChange: (updated: Partial<CumpeoEvent>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function EventoModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: EventoModalProps) {
  const set = (patch: Partial<CumpeoEvent>) => onChange({ ...editing, ...patch });

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Evento / Feria' : 'Nuevo Evento / Feria'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre */}
        <Field label="Nombre del Evento" required>
          <input
            required
            className={inputCls}
            placeholder="Ej: Fiesta de San Sebastián"
            value={editing.nombre || ''}
            onChange={(e) => set({ nombre: e.target.value })}
          />
        </Field>

        {/* Tipo + Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de Evento">
            <select
              className={selectCls}
              value={editing.tipo || ''}
              onChange={(e) => set({ tipo: e.target.value })}
            >
              <option value="">Seleccionar tipo…</option>
              <option value="fiesta-religiosa">Fiesta Religiosa</option>
              <option value="feria">Feria / Mercado</option>
              <option value="centro-evento">Centro de Eventos</option>
              <option value="cultural">Cultural</option>
              <option value="deportivo">Deportivo</option>
            </select>
          </Field>
          <Field label="Fecha" hint="Ej: 20 de enero / Fines de semana">
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className={inputCls + ' pl-8'}
                placeholder="20 de enero / Todos los fines de semana"
                value={editing.fecha || ''}
                onChange={(e) => set({ fecha: e.target.value })}
              />
            </div>
          </Field>
        </div>

        {/* Descripción */}
        <Field label="Descripción" required>
          <textarea
            required
            className={textareaCls}
            placeholder="Descripción breve del evento…"
            value={editing.descripcion || ''}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        {/* Descripción larga */}
        <Field label="Descripción Detallada" hint="Información completa, historia, qué esperar">
          <textarea
            className={textareaCls}
            rows={5}
            placeholder="Historia del evento, tradiciones, actividades…"
            value={editing.descripcionLarga || ''}
            onChange={(e) => set({ descripcionLarga: e.target.value })}
          />
        </Field>

        {/* Dirección */}
        <DireccionField
          label="Lugar / Dirección"
          icon={<MapPin size={14} />}
          placeholder="Ej: Plaza de Cumpeo / Alameda"
          value={editing.direccion}
          onChange={(direccion) => set({ direccion })}
        />

        {/* Coordenadas Refactorizadas con Selector de Mapa */}
        <CoordinatesPicker
          coordinates={editing.coordenadas as any}
          onChange={(coordenadas) => set({ coordenadas: coordenadas as any })}
          modalTitle={`Ubicación de ${editing.nombre || 'Evento'}`}
        />

        {/* Tags */}
        <CommaSeparatedField
          label="Etiquetas"
          icon={<Tag size={14} />}
          placeholder="religioso, enero, tradición…"
          hint="Separadas por coma"
          value={editing.tags || []}
          onChange={(tags) => set({ tags })}
        />

        {/* Switches: Recurrente + Destacado + Activo */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide">
            Opciones de Publicación
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-soft transition-colors border border-border">
              <span className="text-sm font-medium text-text-primary">Recurrente</span>
              <input
                type="checkbox"
                className="accent-rojo w-4 h-4"
                checked={editing.recurrente ?? true}
                onChange={(e) => set({ recurrente: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-soft transition-colors border border-border">
              <span className="text-sm font-medium text-text-primary">Destacado</span>
              <input
                type="checkbox"
                className="accent-rojo w-4 h-4"
                checked={editing.destacado ?? false}
                onChange={(e) => set({ destacado: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-soft transition-colors border border-border">
              <span className="text-sm font-medium text-text-primary">Activo</span>
              <input
                type="checkbox"
                className="accent-rojo w-4 h-4"
                checked={editing.activo ?? true}
                onChange={(e) => set({ activo: e.target.checked })}
              />
            </label>
          </div>
        </div>

        <MediaFields
          imagenPrincipal={editing.imagenPrincipal}
          onImagenChange={(imagenPrincipal) => set({ imagenPrincipal })}
          galeria={editing.galeria}
          onGaleriaChange={(galeria) => set({ galeria })}
        />

        <ModalActions onClose={onClose} isPending={isPending} />
      </form>
    </ModalWrapper>
  );
}
