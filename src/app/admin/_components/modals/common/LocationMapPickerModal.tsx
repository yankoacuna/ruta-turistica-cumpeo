'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Search,
  Compass,
  Crosshair,
  X,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { Coordinates } from '@/lib/types';

interface LocationMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: Coordinates | null;
  onConfirm: (coords: Coordinates) => void;
  title?: string;
}

const DEFAULT_CUMPEO_COORDS: Coordinates = {
  lat: -35.281739,
  lng: -71.258714,
};

// ── Componente Interno con acceso al contexto de Google Maps ─────────
interface InnerMapPickerProps {
  initialCoords: Coordinates;
  onClose: () => void;
  onConfirm: (coords: Coordinates) => void;
  title: string;
}

function InnerMapPicker({
  initialCoords,
  onClose,
  onConfirm,
  title,
}: InnerMapPickerProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  const [coords, setCoords] = useState<Coordinates>(initialCoords);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Mover el mapa a unas coordenadas específicas
  const panToCoords = useCallback(
    (newCoords: Coordinates, zoom = 16) => {
      setCoords(newCoords);
      if (map) {
        map.panTo(newCoords);
        map.setZoom(zoom);
      }
    },
    [map]
  );

  // Inicializar Google Places Autocomplete cuando la librería esté lista
  useEffect(() => {
    if (!placesLib || !searchInputRef.current) return;

    // Límites preferenciales en la Región del Maule / Cumpeo
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-35.8, -71.8),
      new google.maps.LatLng(-34.8, -70.8)
    );

    const autocomplete = new placesLib.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: 'cl' },
      fields: ['geometry', 'name', 'formatted_address'],
      bounds,
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const found: Coordinates = {
          lat: Number(place.geometry.location.lat().toFixed(6)),
          lng: Number(place.geometry.location.lng().toFixed(6)),
        };
        panToCoords(found, 17);
        setSearchError(null);
        if (place.formatted_address || place.name) {
          setSearchQuery(place.name || place.formatted_address || '');
        }
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [placesLib, panToCoords]);

  // Centrar inicialmente el mapa
  useEffect(() => {
    if (map && initialCoords) {
      map.panTo(initialCoords);
      map.setZoom(16);
    }
  }, [map, initialCoords]);

  // Manejo de clic en el mapa para posicionar el pin
  const handleMapClick = (ev: MapMouseEvent) => {
    if (ev.detail.latLng) {
      const clickedCoords: Coordinates = {
        lat: Number(ev.detail.latLng.lat.toFixed(6)),
        lng: Number(ev.detail.latLng.lng.toFixed(6)),
      };
      setCoords(clickedCoords);
      setSearchError(null);
    }
  };

  // Búsqueda usando Google PlacesService y Google Geocoding
  const handleSearch = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      let foundLocation: Coordinates | null = null;

      // 1. Intentar con Google PlacesService (busca nombres de locales, atractivos, negocios y parques)
      if (placesLib && map) {
        try {
          const service = new placesLib.PlacesService(map);
          const cumpeoCenter = new google.maps.LatLng(
            DEFAULT_CUMPEO_COORDS.lat,
            DEFAULT_CUMPEO_COORDS.lng
          );

          const placeQuery =
            query.toLowerCase().includes('cumpeo') || query.toLowerCase().includes('chile')
              ? query
              : `${query}, Cumpeo, Chile`;

          const placeResult = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
            service.findPlaceFromQuery(
              {
                query: placeQuery,
                fields: ['geometry', 'name', 'formatted_address'],
                locationBias: cumpeoCenter,
              },
              (results, status) => {
                if (
                  status === placesLib.PlacesServiceStatus.OK &&
                  results &&
                  results[0]?.geometry?.location
                ) {
                  const loc = results[0].geometry.location;
                  resolve({ lat: loc.lat(), lng: loc.lng() });
                } else {
                  // Probar con textSearch si findPlaceFromQuery no lo encontró
                  service.textSearch(
                    {
                      query: placeQuery,
                      location: cumpeoCenter,
                      radius: 25000,
                    },
                    (textResults, textStatus) => {
                      if (
                        textStatus === placesLib.PlacesServiceStatus.OK &&
                        textResults &&
                        textResults[0]?.geometry?.location
                      ) {
                        const loc = textResults[0].geometry.location;
                        resolve({ lat: loc.lat(), lng: loc.lng() });
                      } else {
                        resolve(null);
                      }
                    }
                  );
                }
              }
            );
          });

          if (placeResult) {
            foundLocation = placeResult;
          }
        } catch (err) {
          console.warn('Google PlacesService falló, probando Geocoder...', err);
        }
      }

      // 2. Intentar con Google Geocoder oficial (para direcciones de calles y números)
      if (!foundLocation && geocodingLib) {
        try {
          const geocoder = new geocodingLib.Geocoder();
          const geocodeResult = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
            geocoder.geocode(
              {
                address: query.toLowerCase().includes('chile') ? query : `${query}, Cumpeo, Chile`,
                componentRestrictions: { country: 'CL' },
                region: 'cl',
              },
              (results, status) => {
                if (status === 'OK' && results && results[0]?.geometry?.location) {
                  const loc = results[0].geometry.location;
                  resolve({ lat: loc.lat(), lng: loc.lng() });
                } else {
                  resolve(null);
                }
              }
            );
          });
          if (geocodeResult) {
            foundLocation = geocodeResult;
          }
        } catch (err) {
          console.warn('Google Geocoder falló...', err);
        }
      }

      if (foundLocation) {
        const rounded: Coordinates = {
          lat: Number(foundLocation.lat.toFixed(6)),
          lng: Number(foundLocation.lng.toFixed(6)),
        };
        panToCoords(rounded, 17);
      } else {
        setSearchError('No se encontró ese lugar en Google Maps. Puedes buscar una calle cercana o hacer clic directamente en el mapa para ubicar el pin.');
      }
    } catch {
      setSearchError('Error al buscar la ubicación. Intenta nuevamente o selecciona directamente en el mapa.');
    } finally {
      setIsSearching(false);
    }
  };

  // Centrar en Cumpeo
  const handleCenterCumpeo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    panToCoords(DEFAULT_CUMPEO_COORDS, 16);
  };

  // Obtener GPS del usuario
  const handleGetGps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!navigator.geolocation) {
      setSearchError('La geolocalización no está soportada por tu navegador.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const userLoc: Coordinates = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        panToCoords(userLoc, 17);
      },
      () => {
        setIsGettingGps(false);
        setSearchError('No se pudo obtener la posición GPS actual.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm(coords);
    onClose();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Estilos para que el autocompletado de Google Places aparezca por encima del modal */}
      <style>{`
        .pac-container {
          z-index: 100000 !important;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.18);
          font-family: inherit;
          margin-top: 4px;
        }
        .pac-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
        }
        .pac-item:hover {
          background-color: #F8F9FA;
        }
        .pac-item-query {
          font-size: 13px;
          color: #1E1E24;
        }
      `}</style>

      <div
        className="bg-white w-full max-w-[760px] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-border bg-white sticky top-0 z-10">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-text-primary flex items-center gap-2">
              <MapPin size={20} className="text-rojo" />
              {title}
            </h3>
            <p className="text-xs text-text-muted">
              Usa el buscador con sugerencias de Google o haz clic en el mapa para ajustar el pin.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-text-muted hover:text-rojo hover:bg-[#FFE0E2] transition-all p-1.5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal (IMPORTANTE: NO USAR <form> para evitar submits anidados) */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {/* Barra de Búsqueda con Google Places Autocomplete */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-surface-soft focus:bg-white focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all placeholder:text-text-muted/70"
                placeholder="Escribe una dirección o lugar (ej: Plaza de Cumpeo, Calle Prat 120…)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearch(e);
                  }
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none"
                title="Buscador oficial de Google Places conectado"
              >
                <Sparkles size={10} /> Google
              </span>
            </div>
            <button
              type="button"
              disabled={isSearching || !searchQuery.trim()}
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1E1E24] hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              <span>Buscar</span>
            </button>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCenterCumpeo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface-soft hover:bg-white text-text-secondary transition-colors cursor-pointer"
            >
              <Compass size={13} className="text-rojo" />
              <span>Centrar en Cumpeo</span>
            </button>
            <button
              type="button"
              disabled={isGettingGps}
              onClick={handleGetGps}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface-soft hover:bg-white text-text-secondary transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Crosshair size={13} className={`text-rojo ${isGettingGps ? 'animate-spin' : ''}`} />
              <span>{isGettingGps ? 'Obteniendo GPS…' : 'Mi GPS actual'}</span>
            </button>
            {searchError && (
              <span className="text-xs text-red-600 flex items-center gap-1 ml-auto">
                <AlertCircle size={13} /> {searchError}
              </span>
            )}
          </div>

          {/* Canvas de Google Maps */}
          <div className="relative w-full h-[380px] sm:h-[420px] rounded-xl overflow-hidden border border-border">
            <Map
              defaultCenter={initialCoords || DEFAULT_CUMPEO_COORDS}
              defaultZoom={15}
              mapId="LOCATION_PICKER_MAP"
              disableDefaultUI={false}
              zoomControl={true}
              streetViewControl={false}
              mapTypeControl={false}
              onClick={handleMapClick}
            >
              <AdvancedMarker
                position={coords}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    setCoords({
                      lat: Number(e.latLng.lat().toFixed(6)),
                      lng: Number(e.latLng.lng().toFixed(6)),
                    });
                  }
                }}
              >
                <div className="flex flex-col items-center cursor-grab active:cursor-grabbing group">
                  <div className="bg-rojo text-white p-2 rounded-full shadow-xl border-2 border-white ring-2 ring-rojo/20 transform group-hover:scale-110 transition-transform">
                    <MapPin size={22} />
                  </div>
                  <div className="w-2.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5" />
                </div>
              </AdvancedMarker>
            </Map>

            {/* Ayuda flotante */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-border text-[11px] text-text-secondary flex items-center gap-1.5 pointer-events-none">
              <MapPin size={13} className="text-rojo shrink-0" />
              <span>Haz clic en el mapa o arrastra el marcador para precisar la ubicación</span>
            </div>
          </div>

          {/* Barra de Coordenadas Seleccionadas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface-soft rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="text-xs font-mono text-text-secondary">
                <span className="font-bold text-text-primary">Lat:</span> {coords.lat.toFixed(6)}{' '}
                <span className="text-text-muted">|</span>{' '}
                <span className="font-bold text-text-primary">Lng:</span> {coords.lng.toFixed(6)}
              </div>
            </div>
            <div className="text-[11px] text-text-muted">
              Punto seleccionado listo para aplicar
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-gray-50/70">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-border text-text-secondary hover:bg-white transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white shadow-sm transition-all cursor-pointer"
          >
            <Check size={15} />
            Aplicar Coordenadas
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Exportado con Portal y Provider de Google Maps ──────────────
export function LocationMapPickerModal({
  isOpen,
  onClose,
  initialCoordinates,
  onConfirm,
  title = 'Seleccionar Ubicación Geográfica',
}: LocationMapPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const validCoords: Coordinates =
    initialCoordinates &&
    typeof initialCoordinates.lat === 'number' &&
    typeof initialCoordinates.lng === 'number' &&
    !isNaN(initialCoordinates.lat) &&
    !isNaN(initialCoordinates.lng)
      ? {
          lat: Number(initialCoordinates.lat.toFixed(6)),
          lng: Number(initialCoordinates.lng.toFixed(6)),
        }
      : DEFAULT_CUMPEO_COORDS;

  const modalContent = (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'geocoding']}>
      <InnerMapPicker
        initialCoords={validCoords}
        onClose={onClose}
        onConfirm={onConfirm}
        title={title}
      />
    </APIProvider>
  );

  return createPortal(modalContent, document.body);
}
