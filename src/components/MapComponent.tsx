'use client';

import React, { useEffect, useRef } from 'react';
import { POI } from '@/lib/types';
import { getCategoryEmoji } from '@/lib/data';

interface MapComponentProps {
  pois: POI[];
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  userCoords: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export default function MapComponent({
  pois,
  selectedPoi,
  onSelectPoi,
  userCoords,
  initialCenter = { lat: -35.267, lng: -71.250 },
  initialZoom = 14,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet client-side
    import('leaflet').then((L) => {
      if (!isMounted || !mapRef.current) return;

      if (!leafletMapRef.current) {
        const map = L.map(mapRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: initialZoom,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors | Cumpeo Turismo',
        }).addTo(map);

        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;

      // Clear existing markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      // Add markers for POIs
      pois.forEach((poi) => {
        if (!poi.coordenadas?.lat || !poi.coordenadas?.lng) return;

        const emoji = getCategoryEmoji(poi.categoria);

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="
            background: #E63946;
            color: white;
            border: 2px solid #1E1E24;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${emoji}</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([poi.coordenadas.lat, poi.coordenadas.lng], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          onSelectPoi(poi);
        });

        markersRef.current[poi.id] = marker;
      });

      // Update User Location Marker if available
      if (userCoords) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
        } else {
          const userIcon = L.divIcon({
            className: 'user-gps-marker',
            html: `<div style="
              background: #FFC300;
              border: 3px solid #1E1E24;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              box-shadow: 0 0 12px #FFC300;
              animation: pulse 1.5s infinite;
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pois, userCoords]);

  // Center map on selected POI
  useEffect(() => {
    if (selectedPoi && leafletMapRef.current && selectedPoi.coordenadas) {
      leafletMapRef.current.flyTo([selectedPoi.coordenadas.lat, selectedPoi.coordenadas.lng], 16, {
        duration: 1.2,
      });
    }
  }, [selectedPoi]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
    </div>
  );
}
