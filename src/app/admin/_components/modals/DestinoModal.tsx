import React from 'react';
import { Star, Tag } from 'lucide-react';
import { Destination } from '@/lib/types';
import { slugify } from '@/lib/slug';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import {
  LocationField,
  CommaSeparatedField,
  MediaFields,
  HorarioField,
} from './common';

interface DestinoModalProps {
  editing: Partial<Destination>;
  onChange: (updated: Partial<Destination>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function DestinoModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: DestinoModalProps) {
  const set = (patch: Partial<Destination>) => onChange({ ...editing, ...patch });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slugify(editing.nombre || '') || editing.slug || 'destino';
    onChange({ ...editing, slug: finalSlug });
    onSubmit(e);
  };

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Destino' : 'Nuevo Destino'}
      onClose={onClose}
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        {/* Nombre + Categoría */}
        <div id="tour-dest-nombre" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre del Destino" required>
            <input
              required
              className={inputCls}
              placeholder="Ej: Mural de Condorito"
              value={editing.nombre || ''}
              onChange={(e) => {
                const nombre = e.target.value;
                set({ nombre, slug: slugify(nombre) });
              }}
            />
          </Field>
          <Field label="Categoría" required>
            <select
              className={selectCls}
              value={editing.categoria}
              onChange={(e) => set({ categoria: e.target.value as Destination['categoria'] })}
            >
              <option value="cultural">Cultural</option>
              <option value="historico">Histórico</option>
              <option value="naturaleza">Naturaleza</option>
              <option value="gastronomia">Gastronomía</option>
              <option value="patrimonio">Patrimonio</option>
              <option value="entretencion">Entretención</option>
            </select>
          </Field>
        </div>

        {/* Descripciones */}
        <div id="tour-dest-desc" className="flex flex-col gap-4">
          <Field label="Descripción Corta" required>
            <textarea
              required
              className={textareaCls}
              placeholder="Resumen breve para las tarjetas…"
              value={editing.descripcionCorta || ''}
              onChange={(e) => set({ descripcionCorta: e.target.value })}
            />
          </Field>
          <Field label="Descripción Completa">
            <textarea
              className={textareaCls}
              style={{ minHeight: '110px' }}
              placeholder="Descripción detallada del destino…"
              value={editing.descripcionLarga || ''}
              onChange={(e) => set({ descripcionLarga: e.target.value })}
            />
          </Field>
          <Field label="Historia / Contexto">
            <textarea
              className={textareaCls}
              placeholder="Historia e información histórica del lugar…"
              value={editing.historia || ''}
              onChange={(e) => set({ historia: e.target.value })}
            />
          </Field>
        </div>

        {/* Duración */}
        <Field label="Duración Sugerida">
          <input
            className={inputCls}
            placeholder="Ej: 45 minutos"
            value={editing.duracionVisita || ''}
            onChange={(e) => set({ duracionVisita: e.target.value })}
          />
        </Field>

        {/* Ubicación: dirección + mapa sincronizados */}
        <LocationField
          direccion={editing.direccion}
          onDireccionChange={(direccion) => set({ direccion })}
          coordinates={editing.coordenadas}
          onCoordinatesChange={(coordenadas) => set({ coordenadas })}
          direccionPlaceholder="Calle / Localidad, Cumpeo"
          modalTitle={`Ubicación de ${editing.nombre || 'Destino'}`}
        />

        {/* Horario de Atención */}
        <HorarioField value={editing.horario} onChange={(horario) => set({ horario })} />

        {/* Cómo llegar */}
        <Field label="Cómo Llegar">
          <textarea
            className={textareaCls}
            style={{ minHeight: '70px' }}
            placeholder="Instrucciones para llegar al destino…"
            value={editing.comoLlegar || ''}
            onChange={(e) => set({ comoLlegar: e.target.value })}
          />
        </Field>

        <MediaFields
          imagenWrapperId="tour-dest-image"
          imagenPrincipal={editing.imagenPrincipal}
          onImagenChange={(imagenPrincipal) => set({ imagenPrincipal })}
          galeria={editing.galeria}
          onGaleriaChange={(galeria) => set({ galeria })}
        />

        {/* Tags Refactorizado */}
        <CommaSeparatedField
          label="Tags"
          icon={<Tag size={14} />}
          placeholder="historia, arte, familia, foto"
          hint="Separados por coma"
          value={editing.tags || []}
          onChange={(tags) => set({ tags })}
        />

        {/* Destacado */}
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-[#FFF3C4]/60 border border-[#FDE68A]">
          <input
            type="checkbox"
            id="destacado"
            className="w-4 h-4 accent-rojo rounded cursor-pointer"
            checked={editing.destacado || false}
            onChange={(e) => set({ destacado: e.target.checked })}
          />
          <label
            htmlFor="destacado"
            className="text-sm font-semibold text-text-primary cursor-pointer flex items-center gap-1.5"
          >
            <Star size={14} className="text-[#B47900]" />
            Marcar como Destino Destacado
          </label>
        </div>

        <div id="tour-dest-actions">
          <ModalActions onClose={onClose} isPending={isPending} />
        </div>
      </form>
    </ModalWrapper>
  );
}
