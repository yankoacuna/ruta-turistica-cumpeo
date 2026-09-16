'use client';

import { useCallback, useEffect, useState } from 'react';
import { VisitasDetalle, VisitRangoPreset } from '@/lib/types';
import { getVisitasDetalleAdmin } from '../analyticsActions';

export interface UseVisitasDetalle {
  datos: VisitasDetalle | null;
  pagina: number;
  cargando: boolean;
  error: boolean;
  irAPagina: (pagina: number) => void;
  recargar: () => void;
}

/**
 * Listado paginado de visitas individuales, filtrado por el mismo período que
 * `useVisitStats`. Vive aparte porque tiene su propia paginación y no debe
 * recargar el gráfico ni los agregados del panel.
 *
 * `activo` es si la tabla está a la vista (el panel alterna entre gráfico y
 * tabla): mientras no lo está no tiene sentido consultarla en cada cambio de
 * período, así que la consulta espera a que se active.
 */
export function useVisitasDetalle(
  preset: VisitRangoPreset,
  desde: string,
  hasta: string,
  activo: boolean
): UseVisitasDetalle {
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<VisitasDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(
    async (paginaActual: number) => {
      setCargando(true);
      setError(false);
      try {
        const res = await getVisitasDetalleAdmin(preset, desde || undefined, hasta || undefined, paginaActual);
        if (!res.ok) {
          setError(true);
          setDatos(null);
        } else {
          setDatos(res.data);
        }
      } catch (e) {
        console.error('Error cargando el detalle de visitas:', e);
        setError(true);
      } finally {
        setCargando(false);
      }
    },
    [preset, desde, hasta]
  );

  // Cambiar de período vuelve a la primera página: una página 5 de otro rango no tiene sentido.
  // También se re-ejecuta al activarse, para traer datos frescos la primera vez que se abre la tabla.
  useEffect(() => {
    if (!activo) return;
    if (preset === 'personalizado' && (!desde || !hasta)) return;
    setPagina(1);
    cargar(1);
  }, [preset, desde, hasta, activo, cargar]);

  useEffect(() => {
    if (!activo || pagina === 1) return; // la página 1 ya se cargó arriba
    cargar(pagina);
  }, [pagina, activo, cargar]);

  return {
    datos,
    pagina,
    cargando,
    error,
    irAPagina: setPagina,
    recargar: useCallback(() => cargar(pagina), [cargar, pagina]),
  };
}
