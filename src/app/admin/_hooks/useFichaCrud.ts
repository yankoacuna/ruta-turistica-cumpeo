import { useState, useTransition } from 'react';
import { HookOptions } from '../_types';

/**
 * CRUD de una ficha del catastro en el panel.
 *
 * Destinos, restaurantes, alojamientos y eventos se administran exactamente
 * igual: se abre un formulario vacío o con la ficha elegida, se guarda contra
 * un server action, se refleja el resultado en la lista sin recargar, se pide
 * confirmación para borrar y se detecta la sesión caída. Eso estaba escrito
 * cuatro veces, casi idéntico; cualquier arreglo (por ejemplo, tratar bien un
 * error de autorización) había que acordarse de aplicarlo en los cuatro.
 *
 * Acá vive una sola vez. Lo único propio de cada tipo —qué server action usa,
 * cómo es una ficha vacía, cómo se llama en los mensajes— entra por
 * configuración, y sumar un quinto tipo de ficha es escribir esa configuración,
 * no copiar otras ochenta líneas.
 */
export interface FichaCrudConfig<T> {
  /** Ficha en blanco con la que se abre el formulario de "nuevo". */
  nueva: () => Partial<T>;
  /** Server action que crea o actualiza; devuelve la fila guardada. */
  guardar: (data: Partial<T>) => Promise<any>;
  /** Server action que elimina por id. */
  eliminar: (id: string) => Promise<unknown>;
  /** Cómo se nombra el tipo en los avisos: "destino", "restaurante"... */
  etiqueta: string;
  /**
   * Adapta la fila que devuelve Prisma al tipo de la app. Las columnas Json
   * (coordenadas, horario, contacto, galería, tags) llegan como `JsonValue` y
   * cada tipo sabe cuáles son las suyas.
   */
  desdeFila?: (fila: any) => T;
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
}

/**
 * Un error de autorización del servidor (sesión vencida o rol insuficiente)
 * frente a cualquier otra falla.
 *
 * Se reconoce por el texto porque es lo que llega hoy desde los server
 * actions; el comentario queda como recordatorio de que es frágil: Next.js
 * reemplaza el mensaje de una excepción de server action por uno genérico en
 * producción, así que lo robusto es que las acciones devuelvan un resultado
 * con código de error en vez de lanzar. Mientras ese cambio no exista, al
 * menos la regla está escrita en un solo lugar.
 */
function esErrorDeSesion(err: any): boolean {
  const mensaje = String(err?.message ?? '');
  return mensaje.includes('No autorizado') || mensaje.includes('Inicia sesión');
}

export function useFichaCrud<T extends { id: string; nombre?: string }>(
  inicial: T[],
  config: FichaCrudConfig<T>,
  { showToast, confirmAction, onAuthError, onSaved }: HookOptions
): FichaCrud<T> {
  const [items, setItems] = useState<T[]>(inicial);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => setEditing(config.nueva());
  const openEdit = (item: T) => setEditing(item);
  const close = () => setEditing(null);

  const avisarError = (err: any) => {
    if (esErrorDeSesion(err)) onAuthError?.();
    showToast(`Error: ${err?.message ?? 'no se pudo completar la acción'}`, 'error');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.nombre) return;
    startTransition(async () => {
      try {
        const fila = await config.guardar(editing);
        const guardado = (config.desdeFila ? config.desdeFila(fila) : (fila as T));
        setItems((prev) => {
          const existe = prev.some((i) => i.id === guardado.id);
          return existe
            ? prev.map((i) => (i.id === guardado.id ? guardado : i))
            : [...prev, guardado];
        });
        showToast(`"${guardado.nombre}" guardado`, 'success');
        onSaved?.(guardado as { id: string; nombre?: string });
        close();
      } catch (err: any) {
        avisarError(err);
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
        await config.eliminar(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        showToast(`${config.etiqueta.charAt(0).toUpperCase()}${config.etiqueta.slice(1)} eliminado`, 'info');
      } catch (err: any) {
        avisarError(err);
      }
    });
  };

  return { items, setItems, editing, setEditing, isPending, openNew, openEdit, close, handleSave, handleDelete };
}
