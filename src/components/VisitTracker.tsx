'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'cumpeo_visitor_id';
const SESSION_KEY = 'cumpeo_session_id';

/** Id aleatorio anónimo. No contiene nada del usuario ni del dispositivo. */
function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* navegadores antiguos */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Lee (o crea) un id en el storage indicado. Si el navegador bloquea el
 * almacenamiento (modo incógnito estricto, cookies desactivadas) devuelve un id
 * efímero: la visita igual se cuenta, solo que como visitante nuevo.
 */
function getOrCreateId(storage: 'local' | 'session', key: string): string {
  try {
    const store = storage === 'local' ? window.localStorage : window.sessionStorage;
    const existing = store.getItem(key);
    if (existing) return existing;
    const fresh = randomId();
    store.setItem(key, fresh);
    return fresh;
  } catch {
    return randomId();
  }
}

/**
 * Cuenta una visita por cada página del sitio público que ve un turista.
 * Se monta en el layout raíz, así cubre toda navegación (incluida la interna
 * del SPA) sin tener que tocar cada página. El panel /admin queda fuera: las
 * métricas son del sitio, no del trabajo del municipio.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const ultimaRegistrada = useRef<string | null>(null);
  const tituloPrevio = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    let timer = 0;
    let intentos = 0;

    const enviar = () => {
      // La guarda va aquí, al momento de enviar, y no al programar el envío:
      // así el doble montaje de StrictMode (que cancela el primer temporizador)
      // no termina descartando la única visita.
      if (ultimaRegistrada.current === pathname) return;
      ultimaRegistrada.current = pathname;
      tituloPrevio.current = document.title;

      const payload = {
        path: pathname,
        titulo: document.title || null,
        referrer: document.referrer || null,
        visitorId: getOrCreateId('local', VISITOR_KEY),
        sessionId: getOrCreateId('session', SESSION_KEY),
      };

      // keepalive: la petición sobrevive aunque el turista cambie de página
      // inmediatamente. Los errores se ignoran a propósito: una métrica nunca
      // debe romper ni ralentizar la experiencia del visitante.
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    };

    /**
     * En una navegación interna, Next cambia la URL antes que el <title>: leerlo
     * de inmediato guarda el título de la página ANTERIOR (o el genérico del
     * sitio), y el panel termina mostrando varias fichas con el mismo nombre.
     * Por eso se espera a que el título deje de ser el de la página previa, con
     * un tope para no quedarse esperando cuando dos páginas comparten título.
     */
    const revisarTitulo = () => {
      intentos += 1;
      const cambio = document.title && document.title !== tituloPrevio.current;
      if (cambio || intentos >= 8) {
        enviar();
      } else {
        timer = window.setTimeout(revisarTitulo, 250);
      }
    };

    timer = window.setTimeout(revisarTitulo, 400);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
