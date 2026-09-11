export type AdminSection =
  | 'dashboard'
  | 'rutas'
  | 'destinos'
  | 'restaurantes'
  | 'alojamientos'
  | 'eventos'
  | 'textos'
  | 'orden'
  | 'qrcodes'
  | 'backups'
  | 'usuarios';

export type { UserRole, AdminUser, AdminSessionUser } from '@/lib/types';

export type ToastFn = (message: string, type: 'success' | 'error' | 'info') => void;

export type ConfirmFn = (message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;

export interface HookOptions {
  showToast: ToastFn;
  confirmAction: ConfirmFn;
  onAuthError?: () => void;
  password?: string;
}
