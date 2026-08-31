/**
 * Utilidad para cálculo de estado "Abierto Ahora / Cerrado"
 * Basado en la hora oficial de Chile (America/Santiago).
 */

export interface OpeningStatus {
  isOpen: boolean | null; // null si no se pudo determinar
  label: 'Abierto ahora' | 'Cerrado' | 'Horario continuo' | 'Consultar horario';
  badgeColor: 'green' | 'red' | 'gray';
  detail?: string;
}

export function getOpeningStatus(
  schedule: string | Record<string, any> | null | undefined
): OpeningStatus {
  if (!schedule) {
    return {
      isOpen: null,
      label: 'Consultar horario',
      badgeColor: 'gray',
    };
  }

  const scheduleStr =
    typeof schedule === 'string'
      ? schedule
      : schedule.descripcion ||
        (schedule.apertura && schedule.cierre ? `${schedule.apertura} - ${schedule.cierre}` : '');

  if (!scheduleStr) {
    return {
      isOpen: null,
      label: 'Consultar horario',
      badgeColor: 'gray',
    };
  }

  const normalized = scheduleStr.toLowerCase().trim();

  // Caso: Abierto 24 hrs o siempre abierto
  if (
    normalized.includes('24') ||
    normalized.includes('todo el día') ||
    normalized.includes('continuo') ||
    normalized.includes('siempre')
  ) {
    return {
      isOpen: true,
      label: 'Horario continuo',
      badgeColor: 'green',
      detail: scheduleStr,
    };
  }

  // Obtener fecha y hora en zona horaria de Chile
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(now);
    let hour = 0;
    let minute = 0;
    let weekdayStr = '';

    parts.forEach((p) => {
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
      if (p.type === 'weekday') weekdayStr = p.value.toLowerCase();
    });

    const currentMinutes = hour * 60 + minute;

    // Buscar rangos de hora con regex tipo "12:00 - 22:00" o "12:00 a 22:00" o "9:00 - 18:00"
    const timeMatch = scheduleStr.match(/(\d{1,2})[:.](\d{2})\s*(?:-|a|–|to)\s*(\d{1,2})[:.](\d{2})/i);

    if (timeMatch) {
      const openHour = parseInt(timeMatch[1], 10);
      const openMin = parseInt(timeMatch[2], 10);
      const closeHour = parseInt(timeMatch[3], 10);
      const closeMin = parseInt(timeMatch[4], 10);

      const openMinutes = openHour * 60 + openMin;
      let closeMinutes = closeHour * 60 + closeMin;

      // Si cierra después de medianoche (ej: 18:00 - 02:00)
      if (closeMinutes < openMinutes) {
        closeMinutes += 24 * 60;
      }

      let checkCurrent = currentMinutes;
      if (currentMinutes < openMinutes && closeMinutes > 24 * 60) {
        checkCurrent += 24 * 60;
      }

      // Verificar días de cierre si existen (ej. "mar a dom" -> cerrado lunes)
      const dayMap: Record<string, string[]> = {
        lun: ['mon', 'lun'],
        mar: ['tue', 'mar'],
        mie: ['wed', 'mié', 'mie'],
        jue: ['thu', 'jue'],
        vie: ['fri', 'vie'],
        sab: ['sat', 'sáb', 'sab'],
        dom: ['sun', 'dom'],
      };

      if (normalized.includes('mar') && normalized.includes('dom') && !normalized.includes('lun')) {
        // Cerrado lunes
        if (weekdayStr.startsWith('mon')) {
          return {
            isOpen: false,
            label: 'Cerrado',
            badgeColor: 'red',
            detail: 'Cerrado los lunes',
          };
        }
      }

      if (normalized.includes('lun') && normalized.includes('vie') && !normalized.includes('sáb') && !normalized.includes('dom')) {
        // Cerrado fines de semana
        if (weekdayStr.startsWith('sat') || weekdayStr.startsWith('sun')) {
          return {
            isOpen: false,
            label: 'Cerrado',
            badgeColor: 'red',
            detail: 'Abierto de Lun a Vie',
          };
        }
      }

      if (checkCurrent >= openMinutes && checkCurrent <= closeMinutes) {
        return {
          isOpen: true,
          label: 'Abierto ahora',
          badgeColor: 'green',
          detail: `Cierra a las ${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`,
        };
      } else {
        return {
          isOpen: false,
          label: 'Cerrado',
          badgeColor: 'red',
          detail: `Abre a las ${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}`,
        };
      }
    }
  } catch (e) {
    console.error('Error calculando horario:', e);
  }

  return {
    isOpen: null,
    label: 'Consultar horario',
    badgeColor: 'gray',
    detail: scheduleStr,
  };
}
