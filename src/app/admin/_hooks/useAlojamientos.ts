import { useState, useTransition } from 'react';
import { Accommodation } from '@/lib/types';
import { saveAccommodation, deleteAccommodation } from '../actions';
import { ToastFn, HookOptions } from '../_types';

const emptyAcc = (): Partial<Accommodation> => ({
  nombre: '',
  tipo: '',
  descripcion: '',
  coordenadas: { lat: -35.281739, lng: -71.258714 },
  direccion: '',
  servicios: [],
  imagenPrincipal: '',
  contacto: { telefono: '', whatsapp: '', email: '', web: '', instagram: '', facebook: '' },
});

export function useAlojamientos(initial: Accommodation[], { showToast, confirmAction, onAuthError }: HookOptions) {
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
        const saved = await saveAccommodation(editing);
        setAlojamientos((prev) => {
          const idx = prev.findIndex((a) => a.id === saved.id);
          const updated = {
            ...saved,
            coordenadas: saved.coordenadas as any,
            contacto: saved.contacto as any,
          } as Accommodation;
          return idx >= 0
            ? prev.map((a) => (a.id === saved.id ? updated : a))
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
      title: 'Eliminar alojamiento',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteAccommodation(id);
        setAlojamientos((prev) => prev.filter((a) => a.id !== id));
        showToast('Alojamiento eliminado', 'info');
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  return { alojamientos, setAlojamientos, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
