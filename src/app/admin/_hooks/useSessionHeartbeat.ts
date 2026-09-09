'use client';

import { useEffect, useRef } from 'react';
import { pingSession } from '../actions';
import { AdminSessionUser } from '@/lib/types';

interface UseSessionHeartbeatOptions {
  /** Solo late mientras hay sesion activa y no se esta mostrando ya el modal de reautenticacion */
  enabled: boolean;
  /** El servidor confirmo que el token ya no es valido (nadie lo renovo a tiempo) */
  onExpired: () => void;
  /** El servidor devolvio una sesion vigente (recien renovada o sin cambios) */
  onRefreshed?: (user: AdminSessionUser) => void;
}

/** Cada cuanto se revisa si corresponde renovar el token */
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
/** Se considera "en uso" si hubo alguna interaccion dentro de esta ventana */
const ACTIVITY_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'wheel'] as const;

/**
 * Mantiene viva la sesion administrativa mientras el usuario realmente esta
 * usando el panel, en vez de dejar que el token expire en silencio y recien
 * enterarse al intentar guardar (perdiendo lo que estaba editando).
 *
 * El servidor ya sabe renovar el token de forma deslizante (shouldRefreshToken
 * en lib/auth.ts renueva si quedan menos de 3 dias), pero esa renovacion solo
 * ocurre como efecto colateral de getAdminSession(), que antes solo se
 * ejecutaba al guardar o borrar algo. Si el usuario solo navegaba o
 * completaba un formulario largo sin guardar, nada la disparaba.
 *
 * Este hook llama a un heartbeat cada pocos minutos -solo si la pestaña esta
 * visible y hubo actividad reciente- para que esa renovacion se dispare de
 * forma transparente. Si la sesion ya vencio mientras el usuario estaba
 * ausente, se detecta apenas vuelve a la pestaña (visibilitychange), en vez
 * de esperar a que intente guardar.
 */
export function useSessionHeartbeat({ enabled, onExpired, onRefreshed }: UseSessionHeartbeatOptions) {
  const lastActivityRef = useRef(Date.now());
  // Callbacks en refs: evita que el efecto se reinicie (y el intervalo se
  // reinicie con el) cada vez que el componente padre re-renderiza con una
  // nueva identidad de funcion para onExpired/onRefreshed.
  const onExpiredRef = useRef(onExpired);
  const onRefreshedRef = useRef(onRefreshed);
  onExpiredRef.current = onExpired;
  onRefreshedRef.current = onRefreshed;

  useEffect(() => {
    if (!enabled) return;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));

    const ping = async () => {
      try {
        const user = await pingSession();
        if (!user) {
          onExpiredRef.current();
        } else {
          onRefreshedRef.current?.(user);
        }
      } catch {
        // Error de red transitorio: no forzamos el modal, se reintenta en el siguiente tick
      }
    };

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivityRef.current > ACTIVITY_WINDOW_MS) return;
      ping();
    };

    const interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
        ping();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled]);
}
