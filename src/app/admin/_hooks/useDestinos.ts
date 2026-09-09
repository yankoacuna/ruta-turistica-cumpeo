import { useState, useTransition } from 'react';
import { Destination } from '@/lib/types';
import { saveDestination, deleteDestination } from '../actions';
import { ToastFn, HookOptions } from '../_types';

const emptyDest = (): Partial<Destination> => ({
  nombre: '',
  slug: '',
  categoria: 'cultural',
  descripcionCorta: '',
  descripcionLarga: '',
  historia: '',
  coordenadas: { lat: -35.267, lng: -71.25 },
  direccion: '',
  horario: '',
  duracionVisita: '',
  comoLlegar: '',
  tags: [],
  destacado: false,
  imagenPrincipal: '',
  galeria: [],
});

export function useDestinos(initial: Destination[], { showToast, onAuthError }: HookOptions) {
  const [destinos, setDestinos] = useState<Destination[]>(initial);
  const [editing, setEditing] = useState<Partial<Destination> | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => setEditing(emptyDest());
  const openEdit = (d: Destination) => setEditing(d);
  const close = () => setEditing(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveDestination(editing);
        setDestinos((prev) => {
          const idx = prev.findIndex((d) => d.id === saved.id);
          const updated = { ...saved, coordenadas: saved.coordenadas as any } as Destination;
          return idx >= 0
            ? prev.map((d) => (d.id === saved.id ? updated : d))
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

  const handleDelete = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      try {
        await deleteDestination(id);
        setDestinos((prev) => prev.filter((d) => d.id !== id));
        showToast('Destino eliminado', 'info');
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  return { destinos, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
