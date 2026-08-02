'use client';

import React, { useEffect } from 'react';
import { POI } from '@/lib/types';
import { getCategoryEmoji } from '@/lib/data';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

interface MapComponentProps {
  pois: POI[];
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  userCoords: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

// Componente interno para controlar el "fly to" (centrar mapa al seleccionar)
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

export default function MapComponent({
  pois,
  selectedPoi,
  onSelectPoi,
  userCoords,
  initialCenter = { lat: -35.267, lng: -71.250 },
  initialZoom = 14,
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "TU_API_KEY_DE_GOOGLE_AQUI") {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-bg)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '3rem' }}>🗺️</div>
          <h2 className="h3 mt-2">Mapa no disponible</h2>
          <p className="text-muted mt-2">
            Falta configurar la clave API de Google Maps en <strong>.env.local</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId="DEMO_MAP_ID" // Requerido para habilitar los AdvancedMarkers (puedes crear uno real en Google Cloud)
          disableDefaultUI={true}
          zoomControl={true}
        >
          <MapController selectedPoi={selectedPoi} />

          {/* Marcadores de Puntos de Interés (POIs) */}
          {pois.map((poi) => {
            if (!poi.coordenadas) return null;
            const isSelected = selectedPoi?.id === poi.id;
            
            return (
              <AdvancedMarker
                key={poi.id}
                position={poi.coordenadas}
                onClick={() => onSelectPoi(poi)}
                zIndex={isSelected ? 1000 : 1}
              >
                <div style={{
                  background: isSelected ? 'var(--color-tierra)' : 'var(--color-rojo)',
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
                }}>
                  {getCategoryEmoji(poi.categoria)}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Marcador GPS del Usuario */}
          {userCoords && (
            <AdvancedMarker position={userCoords} zIndex={2000}>
               <div style={{
                  background: 'var(--color-sol)',
                  border: '3px solid var(--color-text-primary)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  boxShadow: '0 0 12px var(--color-sol)',
                }} />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
