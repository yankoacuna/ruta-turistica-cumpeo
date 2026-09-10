import { useState, useTransition } from 'react';
import { CumpeoEvent } from '@/lib/types';
import { saveEvent, deleteEvent } from '../actions';
import { ToastFn, HookOptions } from '../_types';

const emptyEvento = (): Partial<CumpeoEvent> => ({
  nombre: '',
  tipo: 'cultural',
  descripcion: '',
  descripcionLarga: '',
  fecha: '',
  recurrente: true,
  coordenadas: { lat: -35.281739, lng: -71.258714 },
  direccion: '',
  imagenPrincipal: '',
  galeria: [],
  tags: [],
  destacado: false,
  activo: true,
});

export function useEventos(initial: CumpeoEvent[], { showToast, onAuthError }: HookOptions) {
  const [eventos, setEventos] = useState<CumpeoEvent[]>(initial);
  const [editing, setEditing] = useState<Partial<CumpeoEvent> | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => setEditing(emptyEvento());
  const openEdit = (e: CumpeoEvent) => setEditing(e);
  const close = () => setEditing(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveEvent(editing);
        setEventos((prev) => {
          const idx = prev.findIndex((ev) => ev.id === saved.id);
          const updated = {
            ...saved,
            coordenadas: saved.coordenadas as any,
            galeria: saved.galeria as string[],
            tags: saved.tags as string[],
          } as CumpeoEvent;
          return idx >= 0
            ? prev.map((ev) => (ev.id === saved.id ? updated : ev))
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
        await deleteEvent(id);
        setEventos((prev) => prev.filter((ev) => ev.id !== id));
        showToast('Evento eliminado', 'info');
      } catch (err: any) {
        if (err?.message?.includes('No autorizado') || err?.message?.includes('Inicia sesión')) {
          onAuthError?.();
        }
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  return { eventos, setEventos, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
