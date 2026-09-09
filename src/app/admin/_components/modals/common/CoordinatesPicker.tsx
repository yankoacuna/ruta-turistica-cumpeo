'use client';

import React, { useState } from 'react';
import { MapPin, Map, ExternalLink } from 'lucide-react';
import { Coordinates } from '@/lib/types';
import { Field, inputCls } from '../../Field';
import { LocationMapPickerModal } from './LocationMapPickerModal';

interface CoordinatesPickerProps {
  coordinates?: Coordinates | null;
  onChange: (coords: Coordinates) => void;
  title?: string;
  modalTitle?: string;
}

export function CoordinatesPicker({
  coordinates,
  onChange,
  title = 'Coordenadas Geográficas (GPS)',
  modalTitle,
}: CoordinatesPickerProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const lat = coordinates?.lat ?? -35.267;
  const lng = coordinates?.lng ?? -71.25;

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange({ lat: isNaN(val) ? 0 : val, lng });
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange({ lat, lng: isNaN(val) ? 0 : val });
  };

  const hasCustomCoordinates =
    Boolean(coordinates) &&
    (coordinates?.lat !== -35.267 || coordinates?.lng !== -71.25);

  return (
    <div className="rounded-xl border border-border bg-white p-3.5 flex flex-col gap-3">
      {/* Header con botón para abrir mapa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rojo/10 text-rojo flex items-center justify-center shrink-0">
            <MapPin size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-text-primary block">
              {title}
            </span>
            <span className="text-[11px] text-text-muted">
              {hasCustomCoordinates
                ? 'Coordenadas fijadas para navegación y mapas'
                : 'Ubicación predeterminada (centro de Cumpeo)'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMapOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1E1E24] hover:bg-black text-white shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Map size={14} className="text-sol" />
          <span>Seleccionar en el Mapa</span>
        </button>
      </div>

      {/* Inputs numéricos manuales */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/70">
        <Field label="Latitud" hint="Ej: -35.000000">
          <input
            type="number"
            step="0.000001"
            className={inputCls}
            value={lat}
            onChange={handleLatChange}
            placeholder="-35.000000"
          />
        </Field>
        <Field label="Longitud" hint="Ej: -71.000000">
          <input
            type="number"
            step="0.000001"
            className={inputCls}
            value={lng}
            onChange={handleLngChange}
            placeholder="-71.000000"
          />
        </Field>
      </div>

      {/* Modal de Mapa Interactivo */}
      <LocationMapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialCoordinates={coordinates}
        onConfirm={onChange}
        title={modalTitle || 'Seleccionar Ubicación en el Mapa'}
      />
    </div>
  );
}
