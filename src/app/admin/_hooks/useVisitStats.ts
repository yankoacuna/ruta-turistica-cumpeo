'use client';

import { useCallback, useEffect, useState } from 'react';
import { VisitStats, VisitRangoPreset } from '@/lib/types';
import { getVisitStatsAdmin } from '../analyticsActions';

export interface UseVisitStats {
  stats: VisitStats | null;
  preset: VisitRangoPreset;
  /** Fechas "YYYY-MM-DD" del rango libre; vacías mientras se usa un período fijo. */
  desde: string;
  hasta: string;
  cargando: boolean;
  error: boolean;
  setPreset: (preset: VisitRangoPreset) => void;
  setRangoPersonalizado: (desde: string, hasta: string) => void;
  recargar: () => void;
}

/**
 * Métricas de visitantes del sitio público.
 *
 * Vive en un hook y no dentro del panel porque el dashboard las muestra en dos
 * lugares —la tarjeta de visitantes del grid principal y el bloque detallado—,
 * y ambos deben leer la misma consulta y el mismo período.
 *
 * Se consulta desde el cliente para que abrir el panel no quede esperando por
 * estadísticas, y para poder cambiar el período sin recargar la página.
 */
export function useVisitStats(presetInicial: VisitRangoPreset = '30d'): UseVisitStats {
  const [preset, setPresetState] = useState<VisitRangoPreset>(presetInicial);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(
    async (rango: VisitRangoPreset, desdeYmd: string, hastaYmd: string) => {
      setCargando(true);
      setError(false);
      try {
        const data = await getVisitStatsAdmin(rango, desdeYmd || undefined, hastaYmd || undefined);
        if (!data) {
          setError(true);
          setStats(null);
        } else {
          setStats(data);
        }
      } catch (e) {
        console.error('Error cargando visitas:', e);
        setError(true);
      } finally {
        setCargando(false);
      }
    },
    []
  );

  useEffect(() => {
    // Un rango libre sin las dos fechas todavía no es consultable.
    if (preset === 'personalizado' && (!desde || !hasta)) return;
    cargar(preset, desde, hasta);
  }, [preset, desde, hasta, cargar]);

  const setRangoPersonalizado = useCallback((nuevoDesde: string, nuevoHasta: string) => {
    setDesde(nuevoDesde);
    setHasta(nuevoHasta);
    setPresetState('personalizado');
  }, []);

  return {
    stats,
    preset,
    desde,
    hasta,
    cargando,
    error,
    setPreset: setPresetState,
    setRangoPersonalizado,
    recargar: useCallback(() => cargar(preset, desde, hasta), [cargar, preset, desde, hasta]),
  };
}
