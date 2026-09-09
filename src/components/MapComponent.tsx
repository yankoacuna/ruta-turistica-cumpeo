'use client';

import React, { useEffect, useState } from 'react';
import { POI, TourRoute } from '@/lib/types';
import {
  Map as MapIcon,
  Palette,
  Landmark,
  Leaf,
  UtensilsCrossed,
  BedDouble,
  Award,
  MapPin,
  Plus,
  Minus,
  Compass,
  Crosshair,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface MapComponentProps {
  pois: POI[];
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  userCoords: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  activeRoute?: TourRoute | null;
  resetCenterTrigger?: number;
  onGPSClick: () => void;
  onCenterCumpeoClick: () => void;
}

// ── Icon helper for map markers ───────────────────────────────────────
function getMarkerIcon(categoria: string) {
  switch (categoria) {
    case 'cultural':
      return <Palette size={17} />;
    case 'historico':
      return <Landmark size={17} />;
    case 'naturaleza':
      return <Leaf size={17} />;
    case 'gastronomia':
    case 'restaurante':
      return <UtensilsCrossed size={17} />;
    case 'alojamiento':
      return <BedDouble size={17} />;
    case 'patrimonio':
      return <Award size={17} />;
    default:
      return <MapPin size={17} />;
  }
}

function getMarkerColor(categoria: string) {
  switch (categoria) {
    case 'cultural':
      return '#FFC300';
    case 'historico':
      return '#D97706';
    case 'naturaleza':
      return '#2A9D8F';
    case 'gastronomia':
    case 'restaurante':
      return '#E63946';
    case 'alojamiento':
      return '#0077B6';
    case 'patrimonio':
      return '#8338EC';
    default:
      return '#E63946';
  }
}

// ── Internal: Route drawing using Google Maps Directions API ──────────
const DirectionsRendererComponent = ({
  activeRoute,
  pois,
}: {
  activeRoute: TourRoute | null;
  pois: POI[];
}) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    const service = new routesLibrary.DirectionsService();
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: activeRoute?.color ?? '#E63946',
        strokeWeight: 6,
        strokeOpacity: 0.85,
      },
    });
    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setOptions({
      polylineOptions: {
        strokeColor: activeRoute?.color ?? '#E63946',
        strokeWeight: 6,
        strokeOpacity: 0.85,
      },
    });
  }, [directionsRenderer, activeRoute]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!activeRoute) {
      directionsRenderer.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
      return;
    }

    const routeCoords = activeRoute.poiIds
      .map((id) => pois.find((p) => p.id === id)?.coordenadas)
      .filter((c): c is google.maps.LatLngLiteral => !!c);

    if (routeCoords.length < 2) return;

    directionsService
      .route({
        origin: routeCoords[0],
        destination: routeCoords[routeCoords.length - 1],
        waypoints: routeCoords
          .slice(1, -1)
          .map((location) => ({ location, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => directionsRenderer.setDirections(response))
      .catch((err: Error) =>
        console.error('Error calculando la ruta:', err.message)
      );
  }, [directionsService, directionsRenderer, activeRoute, pois]);

  return null;
};

// ── Internal: Pan controller ─────────────────────────────────────────
const MapController = ({
  selectedPoi,
  resetCenterTrigger,
  initialCenter,
}: {
  selectedPoi: POI | null;
  resetCenterTrigger?: number;
  initialCenter: { lat: number; lng: number };
}) => {
  const map = useMap();

  useEffect(() => {
    if (map && selectedPoi?.coordenadas) {
      map.panTo(selectedPoi.coordenadas);
      map.setZoom(16);
    }
  }, [map, selectedPoi]);

  useEffect(() => {
    if (map && resetCenterTrigger && resetCenterTrigger > 0) {
      map.panTo(initialCenter);
      map.setZoom(15);
    }
  }, [map, resetCenterTrigger, initialCenter]);

  return null;
};

// ── Internal: Unified Floating Toolbar (Zoom, Center, GPS) ───────────
const UnifiedFloatingToolbar = ({
  onGPS,
  onCenterCumpeo,
  hasGPS,
}: {
  onGPS: () => void;
  onCenterCumpeo: () => void;
  hasGPS: boolean;
}) => {
  const map = useMap();

  const handleZoomIn = () => {
    if (map) {
      const z = map.getZoom() || 14;
      map.setZoom(z + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const z = map.getZoom() || 14;
      map.setZoom(z - 1);
    }
  };

  return (
    <div className="absolute right-4 top-[140px] md:top-[125px] z-10 flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden divide-y divide-border">
      <button
        onClick={handleZoomIn}
        className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface-soft hover:text-rojo transition-colors"
        title="Acercar mapa (+)"
        aria-label="Acercar mapa"
      >
        <Plus size={18} />
      </button>
      <button
        onClick={handleZoomOut}
        className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface-soft hover:text-rojo transition-colors"
        title="Alejar mapa (-)"
        aria-label="Alejar mapa"
      >
        <Minus size={18} />
      </button>
      <button
        onClick={onCenterCumpeo}
        className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface-soft hover:text-rojo transition-colors"
        title="Centrar en el pueblo de Cumpeo"
        aria-label="Centrar en Cumpeo"
      >
        <Compass size={18} />
      </button>
      <button
        onClick={onGPS}
        className={`w-11 h-11 flex items-center justify-center transition-colors ${
          hasGPS
            ? 'bg-sol/30 text-rojo hover:bg-sol/50'
            : 'text-text-primary hover:bg-surface-soft hover:text-rojo'
        }`}
        title="Mi posición GPS en tiempo real"
        aria-label="Activar GPS"
      >
        <Crosshair size={19} className={hasGPS ? 'text-rojo animate-pulse' : 'text-text-primary'} />
      </button>
    </div>
  );
};

// ── Main exported component ───────────────────────────────────────────
export default function MapComponent({
  pois,
  selectedPoi,
  onSelectPoi,
  userCoords,
  initialCenter = { lat: -35.267, lng: -71.25 },
  initialZoom = 14,
  activeRoute,
  resetCenterTrigger,
  onGPSClick,
  onCenterCumpeoClick,
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'TU_API_KEY_DE_GOOGLE_AQUI') {
    return (
      <div className="p-5 text-center bg-[#F4F3EF] h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-border flex items-center justify-center text-rojo shadow-sm mb-3">
            <MapIcon size={32} />
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary">Mapa no disponible</h2>
          <p className="text-text-muted text-sm mt-1 max-w-sm">
            Falta configurar la clave API de Google Maps en{' '}
            <strong className="text-text-secondary">.env.local</strong>.
          </p>
        </div>
      </div>
    );
  }

  const displayPois = activeRoute
    ? pois.filter((p) => activeRoute.poiIds.includes(p.id))
    : pois;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId="DEMO_MAP_ID"
          disableDefaultUI={true}
          zoomControl={false}
        >
          <MapController
            selectedPoi={selectedPoi}
            resetCenterTrigger={resetCenterTrigger}
            initialCenter={initialCenter}
          />
          <DirectionsRendererComponent
            activeRoute={activeRoute ?? null}
            pois={pois}
          />

          {/* Unified Floating Toolbar (No overlaps) */}
          <UnifiedFloatingToolbar
            onGPS={onGPSClick}
            onCenterCumpeo={onCenterCumpeoClick}
            hasGPS={!!userCoords}
          />

          {/* POI markers */}
          {displayPois.map((poi, idx) => {
            if (!poi.coordenadas) return null;
            const isSelected = selectedPoi?.id === poi.id;
            const color = activeRoute ? activeRoute.color : getMarkerColor(poi.categoria);

            return (
              <AdvancedMarker
                key={poi.id}
                position={poi.coordenadas}
                onClick={() => onSelectPoi(poi)}
                zIndex={isSelected ? 1000 : 10 + idx}
              >
                <div
                  className={`flex items-center justify-center rounded-full text-white shadow-md cursor-pointer transition-all duration-200 border-2 border-[#1E1E24] ${
                    isSelected
                      ? 'w-12 h-12 scale-110 ring-4 ring-white shadow-xl'
                      : 'w-9 h-9 hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#E63946' : color,
                  }}
                  title={poi.nombre}
                >
                  {getMarkerIcon(poi.categoria)}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* User GPS marker */}
          {userCoords && (
            <AdvancedMarker position={userCoords} zIndex={2000}>
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-sol opacity-75" />
                <div className="w-5 h-5 rounded-full bg-sol border-2 border-[#1E1E24] shadow-md relative z-10" />
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
