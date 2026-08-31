import { useState, useTransition } from 'react';
import { Accommodation } from '@/lib/types';
import { saveAccommodation, deleteAccommodation } from '../actions';
import { ToastFn } from '../_types';

const emptyAcc = (): Partial<Accommodation> => ({
  nombre: '',
  tipo: '',
  descripcion: '',
  coordenadas: { lat: -35.267, lng: -71.25 },
  direccion: '',
  precio: { min: 0, max: 0, moneda: 'CLP', descripcion: '' },
  servicios: [],
  imagenPrincipal: '',
  contacto: { telefono: '', whatsapp: '', email: '', web: '', instagram: '' },
});

interface Options {
  password: string;
  showToast: ToastFn;
}

export function useAlojamientos(initial: Accommodation[], { password, showToast }: Options) {
  const [alojamientos, setAlojamientos] = useState<Accommodation[]>(initial);
  const [editing, setEditing] = useState<Partial<Accommodation> | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => setEditing(emptyAcc());
  const openEdit = (a: Accommodation) => setEditing(a);
  const close = () => setEditing(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveAccommodation(password, editing);
        setAlojamientos((prev) => {
          const idx = prev.findIndex((a) => a.id === saved.id);
          const updated = {
            ...saved,
            coordenadas: saved.coordenadas as any,
            precio: saved.precio as any,
            contacto: saved.contacto as any,
          } as Accommodation;
          return idx >= 0
            ? prev.map((a) => (a.id === saved.id ? updated : a))
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
        await deleteAccommodation(password, id);
        setAlojamientos((prev) => prev.filter((a) => a.id !== id));
        showToast('Alojamiento eliminado', 'info');
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  return { alojamientos, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
