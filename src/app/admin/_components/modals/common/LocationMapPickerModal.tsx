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
  Pencil,
  PenLine,
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
  /** Dirección ya confirmada previamente (si se está ajustando una ubicación existente). */
  initialDireccion?: string | null;
  /** `direccion` viene con la mejor dirección disponible (buscada, geocodificada o escrita a mano); puede venir vacía si el punto no tiene una dirección reconocible y tampoco se escribió una manual. */
  onConfirm: (coords: Coordinates, direccion?: string) => void;
  title?: string;
}

export const DEFAULT_CUMPEO_COORDS: Coordinates = {
  lat: -35.281739,
  lng: -71.258714,
};

/**
 * Detecta si una cadena contiene un Google Plus Code (ej: "QP5W+MF", "843XQP5W+MF")
 */
function containsPlusCode(text: string): boolean {
  if (!text) return false;
  return /\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,}\b/i.test(text);
}

/**
 * Limpia Plus Codes de una cadena de dirección formateada
 */
function cleanAddressText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,}\b\s*,?\s*/gi, '')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

/**
 * Verifica si el texto resultante tras limpiar códigos queda vacío o es solo el país
 */
function isOnlyPlusCodeOrCountry(text: string): boolean {
  if (!text) return true;
  const cleaned = cleanAddressText(text);
  return cleaned === '' || cleaned.toLowerCase() === 'chile';
}

/**
 * Prioriza nombres de calles, rutas y lugares reales por sobre Plus Codes o códigos alfanuméricos
 */
function extractBestStreetAddress(results: google.maps.GeocoderResult[]): string | null {
  if (!results || results.length === 0) return null;

  const streetPriorityTypes = [
    'street_address',
    'premise',
    'subpremise',
    'intersection',
    'route',
    'establishment',
    'point_of_interest',
  ];

  // 1. Primer resultado que sea calle, ruta o punto de interés y no contenga Plus Code
  for (const r of results) {
    const isStreet = r.types?.some((t) => streetPriorityTypes.includes(t));
    const hasCode = r.types?.includes('plus_code') || containsPlusCode(r.formatted_address);
    if (isStreet && !hasCode && r.formatted_address) {
      const cleaned = cleanAddressText(r.formatted_address);
      if (cleaned) return cleaned;
    }
  }

  // 2. Si hay un resultado tipo calle/ruta pero Google le antepuso un Plus Code, limpiar el código y devolver la calle
  for (const r of results) {
    const isStreet = r.types?.some((t) => streetPriorityTypes.includes(t));
    if (isStreet && r.formatted_address) {
      const cleaned = cleanAddressText(r.formatted_address);
      if (cleaned && !isOnlyPlusCodeOrCountry(r.formatted_address)) return cleaned;
    }
  }

  // 3. Revisar si en los componentes de dirección viene el nombre de la calle/ruta ("route")
  for (const r of results) {
    if (r.types?.includes('plus_code')) continue;
    const routeComp = r.address_components?.find((c) => c.types.includes('route'));
    if (routeComp?.long_name) {
      const streetNum = r.address_components?.find((c) => c.types.includes('street_number'))?.long_name;
      const locality = r.address_components?.find((c) =>
        c.types.includes('locality') ||
        c.types.includes('sublocality') ||
        c.types.includes('administrative_area_level_3')
      )?.long_name || 'Cumpeo';

      const streetName = streetNum ? `${routeComp.long_name} ${streetNum}` : routeComp.long_name;
      return `${streetName}, ${locality}`;
    }
  }

  // 4. Cualquier resultado que no sea Plus Code puro (localidad, comuna, barrio: ej. "Cumpeo, Río Claro")
  for (const r of results) {
    const hasCode = r.types?.includes('plus_code') || containsPlusCode(r.formatted_address);
    if (!hasCode && r.formatted_address) {
      const cleaned = cleanAddressText(r.formatted_address);
      if (cleaned && cleaned.toLowerCase() !== 'chile') return cleaned;
    }
  }

  // 5. Fallback: Limpiar el Plus Code del mejor resultado disponible
  for (const r of results) {
    if (r.formatted_address) {
      const cleaned = cleanAddressText(r.formatted_address);
      if (cleaned && cleaned.toLowerCase() !== 'chile') {
        return cleaned;
      }
    }
  }

  return null;
}

// ── Componente Interno con acceso al contexto de Google Maps ─────────
interface InnerMapPickerProps {
  initialCoords: Coordinates;
  initialDireccion?: string | null;
  onClose: () => void;
  onConfirm: (coords: Coordinates, direccion?: string) => void;
  title: string;
}

function InnerMapPicker({
  initialCoords,
  initialDireccion,
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
  /** Mejor dirección disponible para el punto actual (sin Plus Codes) */
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(
    initialDireccion ? cleanAddressText(initialDireccion) : null
  );
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  /** Modo personalizado: para cuando el usuario ingresa una dirección distinta a la que figura en Google Maps */
  const [isCustomAddressActive, setIsCustomAddressActive] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState(initialDireccion || '');

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

  // Geocodificación inversa: dado un punto, obtiene la calle o ruta más cercana sin Plus Codes
  const reverseGeocode = useCallback(
    async (point: Coordinates) => {
      if (!geocodingLib) return;
      setIsResolvingAddress(true);
      try {
        const geocoder = new geocodingLib.Geocoder();
        const address = await new Promise<string | null>((resolve) => {
          geocoder.geocode({ location: point }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const best = extractBestStreetAddress(results);
              resolve(best);
            } else {
              resolve(null);
            }
          });
        });
        setResolvedAddress(address);
        setIsCustomAddressActive((active) => {
          if (!active) {
            setCustomAddressInput(address || '');
          }
          return active;
        });
      } catch {
        setResolvedAddress(null);
      } finally {
        setIsResolvingAddress(false);
      }
    },
    [geocodingLib]
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
        const cleanAddr = place.formatted_address ? cleanAddressText(place.formatted_address) : null;
        const best = cleanAddr || place.name || null;
        setResolvedAddress(best);
        setIsCustomAddressActive(false);
        setCustomAddressInput(best || '');
        if (best) {
          setSearchQuery(place.name || best);
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

  // Centrar inicialmente el mapa una sola vez al montar
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (map && initialCoords && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
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
      reverseGeocode(clickedCoords);
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
        reverseGeocode(rounded);
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
    reverseGeocode(DEFAULT_CUMPEO_COORDS);
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
        reverseGeocode(userLoc);
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
    const finalAddress =
      isCustomAddressActive && customAddressInput.trim()
        ? customAddressInput.trim()
        : (resolvedAddress || customAddressInput.trim() || undefined);
    onConfirm(coords, finalAddress);
    onClose();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
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
        className="bg-white w-full max-w-[760px] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col my-4 max-h-[calc(100vh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-border bg-white shrink-0">
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
            className="text-text-muted hover:text-rojo hover:bg-[#FFE0E2] transition-all p-1.5 rounded-lg shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal (IMPORTANTE: NO USAR <form> para evitar submits anidados) */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 overflow-y-auto">
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
              defaultZoom={16}
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
                    const dragged: Coordinates = {
                      lat: Number(e.latLng.lat().toFixed(6)),
                      lng: Number(e.latLng.lng().toFixed(6)),
                    };
                    setCoords(dragged);
                    reverseGeocode(dragged);
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

          {/* Panel de Dirección y Coordenadas */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-surface-soft rounded-xl border border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                      {isCustomAddressActive ? 'Dirección Personalizada' : 'Dirección Detectada'}
                    </span>
                    {isCustomAddressActive && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-1.5 py-0.5 rounded">
                        Modo manual
                      </span>
                    )}
                  </div>

                  {isResolvingAddress ? (
                    <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                      <Loader2 size={12} className="animate-spin" /> Buscando calle o referencia…
                    </div>
                  ) : isCustomAddressActive ? (
                    <div className="mt-1.5 flex flex-col gap-1">
                      <input
                        type="text"
                        value={customAddressInput}
                        onChange={(e) => setCustomAddressInput(e.target.value)}
                        placeholder="Ej: Camino Los Cristales Km 4, Parcela 12 (frente al retén)"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-text-primary focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                      />
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>Esta dirección se guardará mientras el pin conserva sus coordenadas GPS.</span>
                        {resolvedAddress && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomAddressActive(false);
                              setCustomAddressInput(resolvedAddress);
                            }}
                            className="text-rojo hover:underline cursor-pointer font-medium ml-2 shrink-0"
                          >
                            Usar dirección detectada del mapa
                          </button>
                        )}
                      </div>
                    </div>
                  ) : resolvedAddress ? (
                    <div className="text-xs font-semibold text-text-primary truncate mt-0.5" title={resolvedAddress}>
                      {resolvedAddress}
                    </div>
                  ) : (
                    <div className="text-xs text-text-muted mt-0.5">
                      No se detectó un nombre de calle exacto para este punto en el mapa.
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-text-muted mt-1">
                    GPS: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Opción secundaria: botón para personalizar la dirección si el usuario lo requiere */}
              {!isCustomAddressActive && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomAddressActive(true);
                    setCustomAddressInput(customAddressInput || resolvedAddress || initialDireccion || '');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-white hover:bg-surface-soft text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Permite escribir una dirección personalizada si no coincide con la del mapa"
                >
                  <Pencil size={12} className="text-rojo" />
                  <span>Personalizar dirección</span>
                </button>
              )}
            </div>

            {/* Si no hubo dirección detectada y no está activo el modo personalizado, permitir escribirla */}
            {!isResolvingAddress && !resolvedAddress && !isCustomAddressActive && (
              <div className="pt-1">
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all placeholder:text-text-muted/70"
                  placeholder="Escribe la dirección o referencia para este punto (ej: Camino Vecinal S/N)"
                  value={customAddressInput}
                  onChange={(e) => setCustomAddressInput(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-gray-50/70 shrink-0">
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
  initialDireccion,
  onConfirm,
  title = 'Seleccionar Ubicación Geográfica',
}: LocationMapPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  const validCoords: Coordinates = React.useMemo(() => {
    if (initialCoordinates) {
      const latNum = Number(initialCoordinates.lat);
      const lngNum = Number(initialCoordinates.lng);
      if (!isNaN(latNum) && !isNaN(lngNum) && isFinite(latNum) && isFinite(lngNum)) {
        return {
          lat: Number(latNum.toFixed(6)),
          lng: Number(lngNum.toFixed(6)),
        };
      }
    }
    return DEFAULT_CUMPEO_COORDS;
  }, [initialCoordinates?.lat, initialCoordinates?.lng]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'geocoding']}>
      <InnerMapPicker
        initialCoords={validCoords}
        initialDireccion={initialDireccion}
        onClose={onClose}
        onConfirm={onConfirm}
        title={title}
      />
    </APIProvider>
  );

  return createPortal(modalContent, document.body);
}
