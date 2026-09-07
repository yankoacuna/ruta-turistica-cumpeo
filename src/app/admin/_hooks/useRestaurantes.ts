import { useState, useTransition } from 'react';
import { Restaurant } from '@/lib/types';
import { saveRestaurant, deleteRestaurant } from '../actions';
import { ToastFn } from '../_types';

const emptyRest = (): Partial<Restaurant> => ({
  nombre: '',
  descripcion: '',
  especialidad: '',
  platoEstrella: '',
  coordenadas: { lat: -35.267, lng: -71.25 },
  direccion: '',
  horario: { apertura: '', cierre: '', descripcion: '' },
  contacto: { telefono: '', whatsapp: '', email: '', web: '', instagram: '' },
  imagenPrincipal: '',
  menuUrl: '',
  tags: [],
});

interface Options {
  password: string;
  showToast: ToastFn;
}

export function useRestaurantes(initial: Restaurant[], { password, showToast }: Options) {
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
        const saved = await saveRestaurant(password, editing);
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
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  const handleDelete = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      try {
        await deleteRestaurant(password, id);
        setRestaurantes((prev) => prev.filter((r) => r.id !== id));
        showToast('Restaurante eliminado', 'info');
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  return { restaurantes, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
