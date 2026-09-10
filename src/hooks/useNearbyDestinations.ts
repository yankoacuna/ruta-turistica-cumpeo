'use client';

import { useCallback, useState } from 'react';
import { Destination, POI } from '@/lib/types';
import { sortByDistance } from '@/lib/data';

interface UseNearbyOptions {
  destinations: Destination[];
  limit?: number;
  onMessage?: (msg: string, type: 'info' | 'success' | 'error') => void;
}

/**
 * Encapsula la geolocalizacion de la portada: pide GPS, ordena los destinos
 * por cercania y hace scroll a la seccion de resultados.
 */
export function useNearbyDestinations({ destinations, limit = 6, onMessage }: UseNearbyOptions) {
  const [nearbyList, setNearbyList] = useState<Destination[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasGPS, setHasGPS] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      onMessage?.('Tu navegador no soporta geolocalizacion GPS', 'error');
      return;
    }

    setIsLocating(true);
    onMessage?.('Obteniendo tu posicion GPS...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const pois = destinations.map((d) => ({
          ...d,
          tipo: 'destino' as const,
          descripcionCorta: d.descripcionCorta,
        })) as unknown as POI[];

        const sorted = sortByDistance(pois, coords) as unknown as Destination[];

        setNearbyList(sorted.slice(0, limit));
        setIsLocating(false);
        setHasGPS(true);
        onMessage?.('Destinos cercanos calculados exitosamente', 'success');

        setTimeout(() => {
          document
            .getElementById('section-nearby')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (err) => {
        setIsLocating(false);
        onMessage?.('No se pudo obtener el GPS: ' + err.message, 'error');
      }
    );
  }, [destinations, limit, onMessage]);

  return { nearbyList, isLocating, hasGPS, locate };
}
