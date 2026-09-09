'use client';

import { useEffect, useState } from 'react';
import { getOpeningStatus, OpeningStatus } from '@/lib/openingHours';

type Schedule = Parameters<typeof getOpeningStatus>[0];

/**
 * Calcula el estado "Abierto ahora / Cerrado" en el cliente, despues del montaje.
 *
 * getOpeningStatus() depende de `new Date()`, asi que llamarlo directamente durante
 * el render de un componente que se hidrata (SSR -> cliente) es no-determinista: si
 * el reloj cruza un limite de apertura/cierre entre el render del servidor y la
 * hidratacion, React detecta contenido distinto y lanza "Hydration failed".
 *
 * Este hook siempre devuelve `null` en el primer render (servidor y cliente
 * coinciden) y recien calcula el valor real en un efecto, ya con la hidratacion
 * completa. El badge aparece con un parpadeo imperceptible en vez de romper la pagina.
 */
export function useOpeningStatus(schedule: Schedule): OpeningStatus | null {
  const [status, setStatus] = useState<OpeningStatus | null>(null);

  useEffect(() => {
    setStatus(getOpeningStatus(schedule));
    // Recalcula cada minuto para que el badge no quede obsoleto en visitas largas
    const interval = setInterval(() => setStatus(getOpeningStatus(schedule)), 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schedule)]);

  return status;
}
