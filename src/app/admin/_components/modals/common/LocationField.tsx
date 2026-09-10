'use client';

import React, { useState } from 'react';
import { MapPin, Search, Pencil } from 'lucide-react';
import { Coordinates } from '@/lib/types';
import { LocationMapPickerModal, DEFAULT_CUMPEO_COORDS } from './LocationMapPickerModal';

interface LocationFieldProps {
  direccion?: string | null;
  onDireccionChange: (direccion: string) => void;
  coordinates?: Coordinates | null;
  onCoordinatesChange: (coords: Coordinates) => void;
  modalTitle?: string;
}

/**
 * Dirección + ubicación en el mapa, como un solo dato para quien edita.
 *
 * La dirección ya no se escribe a mano acá: se fija buscando un lugar o
 * marcando el punto en el mapa, y ambas quedan sincronizadas siempre. Si el
 * punto no tiene una dirección que Google reconozca, el propio selector de
 * mapa ofrece escribirla a mano ahí mismo (no acá, para no tentar a que se
 * desincronice del pin).
 */
export function LocationField({
  direccion,
  onDireccionChange,
  coordinates,
  onCoordinatesChange,
  modalTitle = 'Buscar dirección o seleccionar en el mapa',
}: LocationFieldProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const hasCoords = Boolean(
    coordinates &&
      (coordinates.lat !== DEFAULT_CUMPEO_COORDS.lat || coordinates.lng !== DEFAULT_CUMPEO_COORDS.lng)
  );

  const handleMapConfirm = (coords: Coordinates, address?: string) => {
    onCoordinatesChange(coords);
    onDireccionChange(address || '');
  };

  return (
    <div className="rounded-xl border border-border bg-white p-3.5 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-rojo/10 text-rojo flex items-center justify-center shrink-0">
          <MapPin size={16} />
        </div>
        <span className="text-xs font-bold text-text-primary">Ubicación</span>
      </div>

      <div className="flex items-center gap-2.5 p-3 bg-surface-soft rounded-lg border border-border">
        <div className="min-w-0 flex-1">
          {direccion ? (
            <span className="text-sm font-semibold text-text-primary block truncate" title={direccion}>
              {direccion}
            </span>
          ) : (
            <span className="text-sm text-text-muted">
              {hasCoords ? 'Ubicación fijada, sin dirección reconocible' : 'Sin ubicación — búscala en el mapa'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMapOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1E1E24] hover:bg-black text-white shadow-xs transition-all cursor-pointer shrink-0"
        >
          {direccion ? <Pencil size={13} /> : <Search size={14} className="text-sol" />}
          <span>{direccion ? 'Ajustar en el mapa' : 'Buscar en el mapa'}</span>
        </button>
      </div>

      <LocationMapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialCoordinates={coordinates}
        initialDireccion={direccion}
        onConfirm={handleMapConfirm}
        title={modalTitle}
      />
    </div>
  );
}
