'use client';

import React, { useState } from 'react';
import { MapPin, Search, Pencil, Edit3 } from 'lucide-react';
import { Coordinates } from '@/lib/types';
import { LocationMapPickerModal, DEFAULT_CUMPEO_COORDS } from './LocationMapPickerModal';

interface LocationFieldProps {
  direccion?: string | null;
  coordinates?: Coordinates | null;
  /** Actualización atómica de coordenadas y dirección para evitar que una pise a la otra */
  onChange?: (location: { direccion: string; coordenadas: Coordinates }) => void;
  onDireccionChange?: (direccion: string) => void;
  onCoordinatesChange?: (coords: Coordinates) => void;
  modalTitle?: string;
}

/**
 * Dirección + ubicación en el mapa, como un solo dato sincronizado.
 *
 * De uso cotidiano: el usuario busca en el mapa o mueve el marcador para obtener
 * la calle limpia y las coordenadas exactas.
 *
 * Para casos especiales (ej: zonas rurales, parcelas sin numeración o indicaciones por referencia):
 * ofrece la opción secundaria de ingresar un texto de dirección personalizado sin perder
 * las coordenadas fijadas en el mapa.
 */
export function LocationField({
  direccion,
  coordinates,
  onChange,
  onDireccionChange,
  onCoordinatesChange,
  modalTitle = 'Buscar dirección o seleccionar en el mapa',
}: LocationFieldProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  const hasCoords = Boolean(
    coordinates &&
      typeof coordinates.lat === 'number' &&
      typeof coordinates.lng === 'number' &&
      !isNaN(coordinates.lat) &&
      !isNaN(coordinates.lng)
  );

  const handleMapConfirm = (coords: Coordinates, address?: string) => {
    const finalAddress =
      address != null && address.trim() !== '' ? address.trim() : (direccion || '');

    if (onChange) {
      onChange({ direccion: finalAddress, coordenadas: coords });
    } else {
      onCoordinatesChange?.(coords);
      onDireccionChange?.(finalAddress);
    }
  };

  const handleManualDireccionChange = (newDireccion: string) => {
    if (onChange) {
      onChange({
        direccion: newDireccion,
        coordenadas: coordinates || DEFAULT_CUMPEO_COORDS,
      });
    } else {
      onDireccionChange?.(newDireccion);
    }
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
              {hasCoords ? 'Ubicación fijada en el mapa, sin nombre de calle' : 'Sin ubicación — búscala en el mapa'}
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
          {direccion || hasCoords ? <Pencil size={13} /> : <Search size={14} className="text-sol" />}
          <span>{direccion || hasCoords ? 'Ajustar en el mapa' : 'Buscar en el mapa'}</span>
        </button>
      </div>

      {/* Opción secundaria (no de uso cotidiano): Personalizar dirección física distinta a la del mapa */}
      {!isManualInputOpen ? (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setIsManualInputOpen(true)}
            className="text-[11px] text-text-muted hover:text-rojo transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Edit3 size={11} className="text-text-muted" />
            <span>¿La dirección física es distinta a la del mapa o no tiene calle exacta? Escríbela aquí</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 p-2.5 bg-amber-50/50 border border-amber-200/70 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
              <Edit3 size={12} className="text-amber-700" />
              Dirección escrita manual (conserva las coordenadas del mapa)
            </label>
            <button
              type="button"
              onClick={() => setIsManualInputOpen(false)}
              className="text-[10px] text-amber-800/80 hover:text-amber-950 underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
          <input
            type="text"
            value={direccion || ''}
            onChange={(e) => handleManualDireccionChange(e.target.value)}
            placeholder="Ej: Camino Los Cristales Km 4, Parcela 12 (frente al retén)"
            className="w-full px-3 py-1.5 text-xs rounded-md border border-amber-300 bg-white focus:border-rojo focus:ring-1 focus:ring-rojo outline-none text-text-primary placeholder:text-text-muted/60"
          />
          <p className="text-[10px] text-amber-800/80 leading-tight">
            Esta dirección será la visible para los turistas, manteniendo el punto exacto seleccionado en el mapa.
          </p>
        </div>
      )}

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
