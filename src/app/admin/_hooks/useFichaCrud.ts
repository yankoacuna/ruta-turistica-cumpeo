import { useState, useTransition } from 'react';
import { HookOptions } from '../_types';
import { Resultado, ResultadoError, esProblemaDeSesion } from '@/lib/resultado';

/**
 * CRUD de una ficha del catastro en el panel: abre el formulario vacío o con la
 * ficha elegida, guarda contra un server action, refleja el resultado en la
 * lista sin recargar, pide confirmación para borrar y detecta la sesión caída.
 *
 * Destinos, restaurantes, alojamientos y eventos comparten esta mecánica. Lo
 * propio de cada tipo —qué server action usa, cómo es una ficha vacía, cómo se
 * llama en los mensajes— entra por configuración.
 */
export interface FichaCrudConfig<T> {
  /** Ficha en blanco con la que se abre el formulario de "nuevo". */
  nueva: () => Partial<T>;
  /** Server action que crea o actualiza. */
  guardar: (data: Partial<T>) => Promise<Resultado<T>>;
  /** Server action que elimina por id. */
  eliminar: (id: string) => Promise<Resultado<true>>;
  /** Cómo se nombra el tipo en los avisos: "destino", "restaurante"... */
  etiqueta: string;
  /**
   * Adapta la fila que devuelve Prisma al tipo de la app. Las columnas Json
   * (coordenadas, horario, contacto, galería, tags) llegan como `JsonValue` y
   * cada tipo sabe cuáles son las suyas.
   */
  desdeFila?: (fila: Record<string, unknown>) => T;
}

export interface FichaCrud<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  editing: Partial<T> | null;
  setEditing: React.Dispatch<React.SetStateAction<Partial<T> | null>>;
  isPending: boolean;
  openNew: () => void;
  openEdit: (item: T) => void;
  close: () => void;
  handleSave: (e: React.FormEvent) => void;
  handleDelete: (id: string, nombre: string) => Promise<void>;
  /** Errores por campo del último guardado rechazado, para marcarlos en el formulario. */
  erroresCampo: Record<string, string>;
}

/**
 * Mensaje para una falla no prevista. El mensaje real de una excepción de
 * server action no llega al navegador en producción, así que el detalle queda
 * en la consola y en el log del servidor.
 */
const ERROR_INESPERADO = 'No pudimos completar la acción. Vuelve a intentarlo en unos segundos.';

export function useFichaCrud<T extends { id: string; nombre?: string }>(
  inicial: T[],
  config: FichaCrudConfig<T>,
  { showToast, confirmAction, onAuthError, onSaved }: HookOptions
): FichaCrud<T> {
  const [items, setItems] = useState<T[]>(inicial);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const openNew = () => {
    setErroresCampo({});
    setEditing(config.nueva());
  };
  const openEdit = (item: T) => {
    setErroresCampo({});
    setEditing(item);
  };
  const close = () => {
    setErroresCampo({});
    setEditing(null);
  };

  /**
   * Fallo previsto por la acción. Solo la sesión caída cambia la pantalla; el
   * resto deja el formulario abierto con lo que la persona escribió.
   */
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
        const res = await config.guardar(editing);
        if (!res.ok) {
          manejarFallo(res);
          return;
        }

        const guardado = config.desdeFila
          ? config.desdeFila(res.data as unknown as Record<string, unknown>)
          : res.data;
        setItems((prev) => {
          const existe = prev.some((i) => i.id === guardado.id);
          return existe
            ? prev.map((i) => (i.id === guardado.id ? guardado : i))
            : [...prev, guardado];
        });
        showToast(`"${guardado.nombre}" guardado`, 'success');
        onSaved?.(guardado as { id: string; nombre?: string });
        close();
      } catch (err) {
        console.error(`Error inesperado al guardar ${config.etiqueta}:`, err);
        showToast(ERROR_INESPERADO, 'error');
      }
    });
  };

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await confirmAction(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`, {
      title: `Eliminar ${config.etiqueta}`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await config.eliminar(id);

        // Si ya no existe, el objetivo igual se cumplió.
        if (!res.ok && res.codigo !== 'NO_ENCONTRADO') {
          manejarFallo(res);
          return;
        }

        setItems((prev) => prev.filter((i) => i.id !== id));
        const nombreTipo = `${config.etiqueta.charAt(0).toUpperCase()}${config.etiqueta.slice(1)}`;
        showToast(res.ok ? `${nombreTipo} eliminado` : res.mensaje, 'info');
      } catch (err) {
        console.error(`Error inesperado al eliminar ${config.etiqueta}:`, err);
        showToast(ERROR_INESPERADO, 'error');
      }
    });
  };

  return {
    items,
    setItems,
    editing,
    setEditing,
    isPending,
    openNew,
    openEdit,
    close,
    handleSave,
    handleDelete,
    erroresCampo,
  };
}
