'use client';

import React, { useState } from 'react';
import { MapPin, Search, Check } from 'lucide-react';
import { Coordinates } from '@/lib/types';
import { inputCls } from '../../Field';
import { LocationMapPickerModal, DEFAULT_CUMPEO_COORDS } from './LocationMapPickerModal';

interface LocationFieldProps {
  direccion?: string | null;
  onDireccionChange: (direccion: string) => void;
  coordinates?: Coordinates | null;
  onCoordinatesChange: (coords: Coordinates) => void;
  direccionPlaceholder?: string;
  modalTitle?: string;
}

/**
 * Dirección + ubicación en el mapa, como un solo dato para quien edita: escribe la
 * dirección a mano, o la busca/ajusta en el mapa y ambas quedan sincronizadas.
 * Las coordenadas GPS no se muestran como algo que haya que tocar — quedan
 * guardadas por dentro, no todas las direcciones existen en Google Maps.
 */
export function LocationField({
  direccion,
  onDireccionChange,
  coordinates,
  onCoordinatesChange,
  direccionPlaceholder = 'Calle / Localidad',
  modalTitle = 'Buscar dirección o seleccionar en el mapa',
}: LocationFieldProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const hasCoords = Boolean(
    coordinates &&
      (coordinates.lat !== DEFAULT_CUMPEO_COORDS.lat || coordinates.lng !== DEFAULT_CUMPEO_COORDS.lng)
  );

  const handleMapConfirm = (coords: Coordinates, address?: string) => {
    onCoordinatesChange(coords);
    if (address) onDireccionChange(address);
  };

  return (
    <div className="rounded-xl border border-border bg-white p-3.5 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-rojo/10 text-rojo flex items-center justify-center shrink-0">
          <MapPin size={16} />
        </div>
        <span className="text-xs font-bold text-text-primary">Ubicación</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder={direccionPlaceholder}
          value={direccion || ''}
          onChange={(e) => onDireccionChange(e.target.value)}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMapOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1E1E24] hover:bg-black text-white shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Search size={14} className="text-sol" />
          <span>Buscar o ajustar en el mapa</span>
        </button>
      </div>

      <span className="text-[11px] text-text-muted flex items-center gap-1">
        {hasCoords ? (
          <>
            <Check size={12} className="text-emerald-600 shrink-0" />
            Ubicación fijada en el mapa
          </>
        ) : (
          'Escribe la dirección o ajústala en el mapa — no todas las direcciones se encuentran automáticamente.'
        )}
      </span>

      <LocationMapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialCoordinates={coordinates}
        onConfirm={handleMapConfirm}
        title={modalTitle}
      />
    </div>
  );
}
