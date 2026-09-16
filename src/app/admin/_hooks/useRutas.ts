import { useState, useTransition } from 'react';
import { TourRoute } from '@/lib/types';
import { saveTourRoute, deleteTourRoute, updateTourRouteStops } from '../actions';
import { HookOptions } from '../_types';
import { ResultadoError, esProblemaDeSesion } from '@/lib/resultado';

const emptyRuta = (): Partial<TourRoute> => ({
  nombre: '',
  slug: '',
  descripcion: '',
  color: '#E63946',
  poiIds: [],
  duracionEstimada: '',
  distanciaKm: undefined,
  dificultad: 'Fácil',
  mapaImagen: '/assets/images/mapa-ilustrado-ruta-condorito.png',
  destacada: false,
  activo: true,
  orden: 0,
  hitos: [],
  consejos: [],
  tiemposParada: {},
});

/** Ver la nota de useFichaCrud: en producción el mensaje real no llega al navegador. */
const ERROR_INESPERADO = 'No pudimos completar la acción. Vuelve a intentarlo en unos segundos.';

export function useRutas(initial: TourRoute[], { showToast, confirmAction, onAuthError }: HookOptions) {
  const [rutas, setRutas] = useState<TourRoute[]>(initial);
  const [editing, setEditing] = useState<Partial<TourRoute> | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const openNew = () => {
    setErroresCampo({});
    setEditing(emptyRuta());
  };
  const openEdit = (r: TourRoute) => {
    setErroresCampo({});
    setEditing({ ...r });
  };
  const close = () => {
    setErroresCampo({});
    setEditing(null);
  };

  const manejarFallo = (res: ResultadoError) => {
    if (esProblemaDeSesion(res)) onAuthError?.();
    setErroresCampo(res.detalles ?? {});
    showToast(res.mensaje, 'error');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const res = await saveTourRoute(editing);
        if (!res.ok) {
          manejarFallo(res);
          return;
        }

        const saved = res.data;
        setRutas((prev) => {
          const updated = {
            ...saved,
            poiIds: saved.poiIds as string[],
            hitos: saved.hitos as any,
            consejos: saved.consejos as any,
            tiemposParada: saved.tiemposParada as any,
          } as TourRoute;
          const existe = prev.some((r) => r.id === saved.id);
          return existe ? prev.map((r) => (r.id === saved.id ? updated : r)) : [...prev, updated];
        });
        showToast(`Ruta "${saved.nombre}" guardada con éxito`, 'success');
        close();
      } catch (err) {
        console.error('Error inesperado al guardar la ruta:', err);
        showToast(ERROR_INESPERADO, 'error');
      }
    });
  };

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await confirmAction(`¿Eliminar la ruta "${nombre}"? Esta acción no se puede deshacer.`, {
      title: 'Eliminar ruta',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await deleteTourRoute(id);
        if (!res.ok && res.codigo !== 'NO_ENCONTRADO') {
          manejarFallo(res);
          return;
        }
        setRutas((prev) => prev.filter((r) => r.id !== id));
        showToast(res.ok ? 'Ruta eliminada correctamente' : res.mensaje, 'info');
      } catch (err) {
        console.error('Error inesperado al eliminar la ruta:', err);
        showToast(ERROR_INESPERADO, 'error');
      }
    });
  };

  const handleReorderStops = (routeId: string, newPoiIds: string[]) => {
    startTransition(async () => {
      try {
        const res = await updateTourRouteStops(routeId, newPoiIds);
        if (!res.ok) {
          manejarFallo(res);
          return;
        }
        setRutas((prev) => prev.map((r) => (r.id === routeId ? { ...r, poiIds: newPoiIds } : r)));
        showToast('Orden de paradas actualizado', 'success');
      } catch (err) {
        console.error('Error inesperado al reordenar las paradas:', err);
        showToast(ERROR_INESPERADO, 'error');
      }
    });
  };

  return {
    rutas,
    editing,
    setEditing,
    isPending,
    openNew,
    openEdit,
    close,
    handleSave,
    handleDelete,
    handleReorderStops,
    erroresCampo,
  };
}
