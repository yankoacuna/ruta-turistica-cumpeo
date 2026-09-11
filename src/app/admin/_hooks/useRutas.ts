import { useState, useTransition } from 'react';
import { TourRoute } from '@/lib/types';
import { saveTourRoute, deleteTourRoute, updateTourRouteStops } from '../actions';
import { ToastFn, HookOptions } from '../_types';

const emptyRuta = (): Partial<TourRoute> => ({
  nombre: '',
  slug: '',
  descripcion: '',
  color: '#E63946',
  poiIds: [],
  duracionEstimada: '2 horas',
  distanciaKm: 5.0,
  dificultad: 'Fácil',
  mapaImagen: '/assets/images/mapa-ilustrado-ruta-condorito.png',
  destacada: false,
  activo: true,
  orden: 0,
  hitos: [],
  consejos: [],
});

export function useRutas(initial: TourRoute[], { showToast, confirmAction, onAuthError }: HookOptions) {
  const [rutas, setRutas] = useState<TourRoute[]>(initial);
  const [editing, setEditing] = useState<Partial<TourRoute> | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => setEditing(emptyRuta());
  const openEdit = (r: TourRoute) => setEditing({ ...r });
  const close = () => setEditing(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveTourRoute(editing);
        setRutas((prev) => {
          const idx = prev.findIndex((r) => r.id === saved.id);
          const updated = {
            ...saved,
            poiIds: saved.poiIds as string[],
            hitos: saved.hitos as any,
            consejos: saved.consejos as any,
          } as TourRoute;
          return idx >= 0
            ? prev.map((r) => (r.id === saved.id ? updated : r))
            : [...prev, updated];
        });
        showToast(`Ruta "${saved.nombre}" guardada con éxito`, 'success');
        close();
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error: ${err.message}`, 'error');
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
        await deleteTourRoute(id);
        setRutas((prev) => prev.filter((r) => r.id !== id));
        showToast('Ruta eliminada correctamente', 'info');
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  const handleReorderStops = (routeId: string, newPoiIds: string[]) => {
    startTransition(async () => {
      try {
        await updateTourRouteStops(routeId, newPoiIds);
        setRutas((prev) =>
          prev.map((r) => (r.id === routeId ? { ...r, poiIds: newPoiIds } : r))
        );
        showToast('Orden de paradas actualizado', 'success');
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error al reordenar paradas: ${err.message}`, 'error');
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
  };
}
