'use client';

import React, { useEffect, useState } from 'react';
import { POI, TourRoute } from '@/lib/types';
import { getCategoryEmoji } from '@/lib/data';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface MapComponentProps {
  pois: POI[];
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  userCoords: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  activeRoute?: TourRoute | null;
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

  // Initialize services once the library and map are available
  useEffect(() => {
    if (!routesLibrary || !map) return;
    const service = new routesLibrary.DirectionsService();
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true, // We render our own custom markers
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
  }, [routesLibrary, map]); // intentionally exclude activeRoute to avoid re-creating renderer

  // Update renderer color whenever the active route changes
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

  // Request directions whenever the active route or POIs change
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

// ── Internal: Pan to selected POI ────────────────────────────────────
const MapController = ({ selectedPoi }: { selectedPoi: POI | null }) => {
  const map = useMap();

  useEffect(() => {
    if (map && selectedPoi?.coordenadas) {
      map.panTo(selectedPoi.coordenadas);
      map.setZoom(16);
    }
  }, [map, selectedPoi]);

  return null;
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
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'TU_API_KEY_DE_GOOGLE_AQUI') {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          background: 'var(--color-bg)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '3rem' }}>🗺️</div>
          <h2 className="h3 mt-2">Mapa no disponible</h2>
          <p className="text-muted mt-2">
            Falta configurar la clave API de Google Maps en{' '}
            <strong>.env.local</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Only render POIs that belong to the active route, if one is selected
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
          zoomControl={true}
        >
          <MapController selectedPoi={selectedPoi} />
          <DirectionsRendererComponent
            activeRoute={activeRoute ?? null}
            pois={pois}
          />

          {/* POI markers */}
          {displayPois.map((poi) => {
            if (!poi.coordenadas) return null;
            const isSelected = selectedPoi?.id === poi.id;

            return (
              <AdvancedMarker
                key={poi.id}
                position={poi.coordenadas}
                onClick={() => onSelectPoi(poi)}
                zIndex={isSelected ? 1000 : 1}
              >
                <div
                  style={{
                    background: isSelected
                      ? 'var(--color-tierra)'
                      : (activeRoute ? activeRoute.color : 'var(--color-rojo)'),
                    color: 'white',
                    border: '2px solid var(--color-text-primary)',
                    borderRadius: '50%',
                    width: isSelected ? '46px' : '38px',
                    height: isSelected ? '46px' : '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isSelected ? '1.5rem' : '1.2rem',
                    boxShadow: 'var(--shadow-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {getCategoryEmoji(poi.categoria)}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* User GPS marker */}
          {userCoords && (
            <AdvancedMarker position={userCoords} zIndex={2000}>
              <div
                style={{
                  background: 'var(--color-sol)',
                  border: '3px solid var(--color-text-primary)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  boxShadow: '0 0 12px var(--color-sol)',
                }}
              />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
