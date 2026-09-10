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

export interface HookOptions {
  showToast: ToastFn;
  onAuthError?: () => void;
  password?: string;
}
