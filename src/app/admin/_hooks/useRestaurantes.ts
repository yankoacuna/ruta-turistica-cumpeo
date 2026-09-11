import { useState, useTransition } from 'react';
import { Restaurant } from '@/lib/types';
import { saveRestaurant, deleteRestaurant } from '../actions';
import { ToastFn, HookOptions } from '../_types';

const emptyRest = (): Partial<Restaurant> => ({
  nombre: '',
  descripcion: '',
  especialidad: '',
  coordenadas: { lat: -35.281739, lng: -71.258714 },
  direccion: '',
  horario: { apertura: '', cierre: '', descripcion: '' },
  contacto: { telefono: '', whatsapp: '', email: '', web: '', instagram: '', facebook: '' },
  imagenPrincipal: '',
  menuUrl: '',
  tags: [],
});

export function useRestaurantes(initial: Restaurant[], { showToast, confirmAction, onAuthError }: HookOptions) {
  const [restaurantes, setRestaurantes] = useState<Restaurant[]>(initial);
  const [editing, setEditing] = useState<Partial<Restaurant> | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => setEditing(emptyRest());
  const openEdit = (r: Restaurant) => setEditing(r);
  const close = () => setEditing(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveRestaurant(editing);
        setRestaurantes((prev) => {
          const idx = prev.findIndex((r) => r.id === saved.id);
          const updated = {
            ...saved,
            coordenadas: saved.coordenadas as any,
            horario: saved.horario as any,
            contacto: saved.contacto as any,
          } as Restaurant;
          return idx >= 0
            ? prev.map((r) => (r.id === saved.id ? updated : r))
            : [...prev, updated];
        });
        showToast(`"${saved.nombre}" guardado`, 'success');
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
    const ok = await confirmAction(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`, {
      title: 'Eliminar restaurante',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteRestaurant(id);
        setRestaurantes((prev) => prev.filter((r) => r.id !== id));
        showToast('Restaurante eliminado', 'info');
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  return { restaurantes, setRestaurantes, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
