import React from 'react';
import { Accommodation } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls } from '../Field';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  ContactoSection,
  ActivoToggle,
  CommaSeparatedField,
  MediaFields,
  PropietarioField,
} from './common';
import { LocationField } from '@/components/campos';

const TIPO_OPTIONS = [
  { value: 'Cabaña', label: 'Cabaña' },
  { value: 'Hostal', label: 'Hostal' },
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Camping', label: 'Camping' },
  { value: 'Residencial', label: 'Residencial' },
  { value: 'Agroturismo', label: 'Agroturismo' },
];

interface AlojamientoModalProps {
  editing: Partial<Accommodation>;
  onChange: (updated: Partial<Accommodation>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
}

export function AlojamientoModal({
  editing,
  onChange,
  onSubmit,
  onClose,
  isPending,
}: AlojamientoModalProps) {
  const set = (patch: Partial<Accommodation>) => onChange({ ...editing, ...patch });

  return (
    <ModalWrapper
      title={editing.id ? 'Editar Alojamiento' : 'Nuevo Alojamiento'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre + Tipo + Estado Activo */}
        <div id="tour-aloj-nombre" className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Nombre" required>
            <input
              required
              className={inputCls}
              placeholder="Nombre del hospedaje"
              value={editing.nombre || ''}
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Field>
          <Field label="Tipo de Alojamiento">
            <SearchableSelect
              value={editing.tipo || ''}
              onChange={(v) => set({ tipo: v })}
              placeholder="Seleccionar tipo…"
              options={TIPO_OPTIONS}
            />
          </Field>
          <ActivoToggle
            id="acc-activo"
            checked={editing.activo ?? true}
            onChange={(activo) => set({ activo })}
          />
        </div>

        {/* Propietario */}
        <PropietarioField
          value={editing.propietario}
          onChange={(propietario) => set({ propietario })}
          placeholder="Ej: Patricia Navarro Troncoso"
        />

        {/* Descripción + Servicios */}
        <div id="tour-aloj-desc" className="flex flex-col gap-4">
          <Field label="Descripción" required>
            <textarea
              required
              className={textareaCls}
              placeholder="Descripción del alojamiento y sus características…"
              value={editing.descripcion || ''}
              onChange={(e) => set({ descripcion: e.target.value })}
            />
          </Field>

          <CommaSeparatedField
            label="Servicios"
            placeholder="WiFi, Estacionamiento, Piscina, Quincho…"
            hint="Separados por coma"
            value={editing.servicios || []}
            onChange={(servicios) => set({ servicios })}
          />
        </div>

        {/* Ubicación: dirección + mapa sincronizados */}
        <div id="tour-aloj-ubicacion">
          <LocationField
            direccion={editing.direccion}
            coordinates={editing.coordenadas}
            onChange={({ direccion, coordenadas }) => set({ direccion, coordenadas })}
            modalTitle={`Ubicación de ${editing.nombre || 'Alojamiento'}`}
          />
        </div>

        {/* Contacto */}
        <ContactoSection
          contacto={editing.contacto}
          onChange={(contacto) => set({ contacto })}
          instagramPlaceholder="nombre_hospedaje"
          facebookPlaceholder="NombreDelHospedaje"
        />

        <MediaFields
          imagenWrapperId="tour-aloj-image"
          imagenPrincipal={editing.imagenPrincipal}
          onImagenChange={(imagenPrincipal) => set({ imagenPrincipal })}
          galeria={editing.galeria}
          onGaleriaChange={(galeria) => set({ galeria })}
        />

        <div id="tour-aloj-actions">
          <ModalActions onClose={onClose} isPending={isPending} />
        </div>
      </form>
    </ModalWrapper>
  );
}
