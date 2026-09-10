'use client';

/**
 * Proveedor de los textos editables del sitio.
 *
 * Vive en el layout raíz, así que cualquier <Editable /> de cualquier página
 * (incluidas las que se renderizan en el servidor) lee de acá.
 *
 * Cómo se activa el modo edición:
 *   1. Alguien con sesión de CMS entra al sitio con ?edit=1 (el botón "Editar
 *      textos en el sitio" del panel lleva ahí).
 *   2. Se valida la sesión contra el servidor. Si el rol no es ADMIN o EDITOR
 *      no pasa nada: el visitante anónimo nunca ve un solo píxel distinto.
 *   3. Queda marcado en sessionStorage para que el modo sobreviva a la
 *      navegación entre páginas dentro de la misma pestaña.
 *
 * Nada de esto es una barrera de seguridad: la autorización real la aplica
 * saveSiteText() en el servidor, en cada guardado.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/Toast';
import type { SiteTexts } from '@/lib/siteTexts';
import type { EditModeAccess } from '@/lib/types';
import { getEditModeAccess, saveSiteText } from '@/app/admin/siteTextActions';

// La interfaz de edición (y con ella el registro de textos, con sus etiquetas
// y valores originales) se carga solo cuando alguien entra en modo edición.
// Un visitante normal no descarga nada de esto.
const SiteTextEditor = dynamic(
  () => import('./SiteTextEditor').then((m) => m.SiteTextEditor),
  { ssr: false }
);
const EditModeBar = dynamic(() => import('./EditModeBar').then((m) => m.EditModeBar), {
  ssr: false,
});

const EDIT_FLAG = 'cumpeo-cms-edit';

interface SiteTextContextValue {
  /** Texto vigente para una clave: override guardado, o el valor del código. */
  get: (key: string) => string;
  /** true cuando el modo edición está activo para esta sesión. */
  editing: boolean;
  /** true si la sesión tiene permiso de edición (aunque el modo esté apagado). */
  canEdit: boolean;
  /** Abre el editor flotante sobre un texto. */
  openEditor: (key: string) => void;
  /** Claves con un guardado en curso. */
  saving: string[];
}

const SiteTextContext = createContext<SiteTextContextValue | null>(null);

/**
 * Fuera del proveedor devuelve un contexto inerte en vez de lanzar error, para
 * que un <Editable /> mal ubicado no tumbe la página completa. El proveedor
 * está en el layout raíz, así que en la práctica esto no debería ocurrir.
 */
const CONTEXTO_INERTE: SiteTextContextValue = {
  get: () => '',
  editing: false,
  canEdit: false,
  openEditor: () => {},
  saving: [],
};

export function useSiteText(): SiteTextContextValue {
  const ctx = useContext(SiteTextContext);
  if (ctx) return ctx;
  if (process.env.NODE_ENV !== 'production') {
    console.warn('<Editable /> se usó fuera de <SiteTextProvider />: el texto saldrá vacío.');
  }
  return CONTEXTO_INERTE;
}

interface SiteTextProviderProps {
  /**
   * Textos ya resueltos en el servidor (valores por defecto del código con los
   * cambios del CMS aplicados encima). Se envían resueltos para no tener que
   * mandar el registro completo al navegador del visitante.
   */
  initial: SiteTexts;
  children: React.ReactNode;
}

export function SiteTextProvider({ initial, children }: SiteTextProviderProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<SiteTexts>(initial);
  const [editing, setEditing] = useState(false);
  const [access, setAccess] = useState<EditModeAccess>({ canEdit: false, user: null });
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const [saving, setSaving] = useState<string[]>([]);
  const [editadosEnSesion, setEditadosEnSesion] = useState<string[]>([]);

  // Los textos vienen del servidor: si se revalidan (por ejemplo tras guardar
  // en el CMS en otra pestaña) hay que adoptar los nuevos valores.
  useEffect(() => {
    setValues(initial);
  }, [initial]);

  useEffect(() => {
    let cancelado = false;

    const params = new URLSearchParams(window.location.search);
    const pidePorUrl = params.get('edit') === '1';
    let recordado = false;
    try {
      recordado = window.sessionStorage.getItem(EDIT_FLAG) === '1';
    } catch {
      recordado = false;
    }
    if (!pidePorUrl && !recordado) return;

    getEditModeAccess()
      .then((res) => {
        if (cancelado) return;
        setAccess(res);
        if (res.canEdit) {
          setEditing(true);
          try {
            window.sessionStorage.setItem(EDIT_FLAG, '1');
          } catch {
            /* modo privado del navegador: el modo dura solo esta página */
          }
        } else {
          try {
            window.sessionStorage.removeItem(EDIT_FLAG);
          } catch {
            /* nada que limpiar */
          }
        }

        // Saca ?edit=1 de la barra de direcciones para que nadie comparta por
        // error un enlace en modo edición.
        if (pidePorUrl) {
          params.delete('edit');
          const query = params.toString();
          window.history.replaceState(
            null,
            '',
            window.location.pathname + (query ? `?${query}` : '') + window.location.hash
          );
        }
      })
      .catch(() => {
        /* sin sesión válida: el sitio se comporta como para cualquier visitante */
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Los textos llegan ya resueltos desde el servidor, así que buscar la clave
  // alcanza. El '' final solo aparecería con una clave inexistente.
  const get = useCallback((key: string) => values[key] ?? '', [values]);

  const salirDeEdicion = useCallback(() => {
    setEditing(false);
    setEditorKey(null);
    try {
      window.sessionStorage.removeItem(EDIT_FLAG);
    } catch {
      /* nada que limpiar */
    }
  }, []);

  const commit = useCallback(
    async (key: string, nuevo: string) => {
      const anterior = values[key];

      // Optimista: el texto cambia en pantalla antes de que responda el server.
      setValues((prev) => ({ ...prev, [key]: nuevo }));
      setSaving((prev) => [...prev, key]);

      try {
        const res = await saveSiteText(key, nuevo);
        // El servidor devuelve el valor vigente resuelto: si el editor dejó el
        // campo vacío, eso es el texto original del código.
        setValues((prev) => ({ ...prev, [key]: res.valorVigente }));
        setEditadosEnSesion((prev) => (prev.includes(key) ? prev : [...prev, key]));
        showToast(
          res.esOriginal ? 'Texto restaurado al original' : 'Texto actualizado en el sitio',
          'success'
        );
      } catch (error: any) {
        // Revertir: dejar exactamente lo que había antes del intento.
        setValues((prev) => {
          const copia = { ...prev };
          if (anterior === undefined) delete copia[key];
          else copia[key] = anterior;
          return copia;
        });
        showToast(
          error?.message || 'No se pudo guardar el texto. Revisa tu sesión e intenta de nuevo.',
          'error'
        );
      } finally {
        setSaving((prev) => prev.filter((k) => k !== key));
      }
    },
    [values, showToast]
  );

  const ctx = useMemo<SiteTextContextValue>(
    () => ({
      get,
      editing,
      canEdit: access.canEdit,
      openEditor: (key: string) => setEditorKey(key),
      saving,
    }),
    [get, editing, access.canEdit, saving]
  );

  return (
    <SiteTextContext.Provider value={ctx}>
      {children}

      {editing && (
        <>
          <EditModeBar
            usuario={access.user}
            editados={editadosEnSesion.length}
            onSalir={salirDeEdicion}
          />
          {editorKey && (
            <SiteTextEditor
              textKey={editorKey}
              valorActual={get(editorKey)}
              guardando={saving.includes(editorKey)}
              onGuardar={(valor) => commit(editorKey, valor)}
              onCerrar={() => setEditorKey(null)}
            />
          )}
        </>
      )}
    </SiteTextContext.Provider>
  );
}
