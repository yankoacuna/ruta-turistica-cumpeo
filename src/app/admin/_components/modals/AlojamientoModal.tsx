import React from 'react';
import { Accommodation } from '@/lib/types';
import { ModalWrapper, ModalActions } from '../ModalWrapper';
import { Field, inputCls, textareaCls, selectCls } from '../Field';
import {
  LocationField,
  ContactoSection,
  ActivoToggle,
  CommaSeparatedField,
  MediaFields,
  PropietarioField,
} from './common';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <select
              className={selectCls}
              value={editing.tipo || ''}
              onChange={(e) => set({ tipo: e.target.value })}
            >
              <option value="">Seleccionar tipo…</option>
              <option value="Cabaña">Cabaña</option>
              <option value="Hostal">Hostal</option>
              <option value="Hotel">Hotel</option>
              <option value="Camping">Camping</option>
              <option value="Residencial">Residencial</option>
              <option value="Agroturismo">Agroturismo</option>
            </select>
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

        {/* Descripción */}
        <Field label="Descripción" required>
          <textarea
            required
            className={textareaCls}
            placeholder="Descripción del alojamiento y sus características…"
            value={editing.descripcion || ''}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        {/* Servicios */}
        <CommaSeparatedField
          label="Servicios"
          placeholder="WiFi, Estacionamiento, Piscina, Quincho…"
          hint="Separados por coma"
          value={editing.servicios || []}
          onChange={(servicios) => set({ servicios })}
        />

        {/* Ubicación: dirección + mapa sincronizados */}
        <LocationField
          direccion={editing.direccion}
          onDireccionChange={(direccion) => set({ direccion })}
          coordinates={editing.coordenadas}
          onCoordinatesChange={(coordenadas) => set({ coordenadas })}
          modalTitle={`Ubicación de ${editing.nombre || 'Alojamiento'}`}
        />

        {/* Contacto Refactorizado */}
        <ContactoSection
          contacto={editing.contacto}
          telefono={editing.telefono}
          whatsapp={editing.whatsapp}
          onChange={({ contacto, telefono, whatsapp }) =>
            set({ contacto, telefono, whatsapp })
          }
          instagramPlaceholder="@nombre_hospedaje"
        />

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
