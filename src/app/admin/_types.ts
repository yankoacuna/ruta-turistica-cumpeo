// Tipos compartidos del módulo admin (privados a esta ruta)
export type AdminSection = 'dashboard' | 'destinos' | 'restaurantes' | 'alojamientos' | 'qrcodes' | 'backups';

export type ToastFn = (message: string, type: 'success' | 'error' | 'info') => void;
