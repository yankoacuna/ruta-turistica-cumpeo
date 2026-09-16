export type AdminSection =
  | 'dashboard'
  | 'solicitudes'
  | 'rutas'
  | 'destinos'
  | 'restaurantes'
  | 'alojamientos'
  | 'eventos'
  | 'textos'
  | 'apariencia'
  | 'orden'
  | 'qrcodes'
  | 'backups'
  | 'usuarios'
  | 'notificaciones';

/**
 * Las secciones que son un catastro de fichas y comparten tabla, formulario y
 * acciones. Es lo que admite AdminTable.
 */
export type CatastroSection = Extract<
  AdminSection,
  'destinos' | 'restaurantes' | 'alojamientos' | 'eventos'
>;

export type { UserRole, AdminUser, AdminSessionUser } from '@/lib/types';

export type ToastFn = (message: string, type: 'success' | 'error' | 'info') => void;

export type ConfirmFn = (message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;

export interface HookOptions {
  showToast: ToastFn;
  confirmAction: ConfirmFn;
  onAuthError?: () => void;
  password?: string;
  /**
   * Se llama tras guardar con exito una ficha. Lo usa el panel para cerrar el
   * ciclo de una solicitud: la ficha creada a partir de ella queda enlazada y
   * la solicitud pasa a "publicada", sin que nadie tenga que acordarse.
   */
  onSaved?: (saved: { id: string; nombre?: string }) => void;
}
