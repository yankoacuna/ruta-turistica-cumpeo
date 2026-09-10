'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // En desarrollo, desregistrar Service Workers y limpiar cachés locales para evitar desincronizaciones de UI e hidratación
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // En producción, registrar el Service Worker normalmente
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registrado con éxito:', reg.scope);
        })
        .catch((err) => {
          console.warn('Error al registrar Service Worker:', err);
        });
    });
  }, []);

  return null;
}
