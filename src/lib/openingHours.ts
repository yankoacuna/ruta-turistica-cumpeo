/**
 * Utilidad para cálculo de estado "Abierto Ahora / Cerrado"
 * Basado en la hora oficial de Chile (America/Santiago).
 */

import { DiaSemana, Horario, HorarioModo } from './types';

export interface OpeningStatus {
  isOpen: boolean | null; // null si no se pudo determinar
  label: 'Abierto ahora' | 'Cerrado' | 'Horario continuo' | 'Consultar horario';
  badgeColor: 'green' | 'red' | 'gray';
  detail?: string;
}

export const DIAS_SEMANA: { key: DiaSemana; label: string; short: string }[] = [
  { key: 'lun', label: 'Lunes', short: 'Lun' },
  { key: 'mar', label: 'Martes', short: 'Mar' },
  { key: 'mie', label: 'Miércoles', short: 'Mié' },
  { key: 'jue', label: 'Jueves', short: 'Jue' },
  { key: 'vie', label: 'Viernes', short: 'Vie' },
  { key: 'sab', label: 'Sábado', short: 'Sáb' },
  { key: 'dom', label: 'Domingo', short: 'Dom' },
];

const DIA_LABEL: Record<DiaSemana, string> = Object.fromEntries(
  DIAS_SEMANA.map((d) => [d.key, d.short])
) as Record<DiaSemana, string>;

const DIA_ALIASES: Record<string, DiaSemana> = {
  lun: 'lun', lunes: 'lun',
  mar: 'mar', martes: 'mar',
  mie: 'mie', miercoles: 'mie',
  jue: 'jue', jueves: 'jue',
  vie: 'vie', viernes: 'vie',
  sab: 'sab', sabado: 'sab',
  dom: 'dom', domingo: 'dom',
};

/** Acepta claves cortas ('dom') o nombres completos ('domingo'), con o sin tildes. */
function normalizeDia(raw: string): DiaSemana | null {
  const key = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  return DIA_ALIASES[key] || null;
}

function normalizeDiasCierre(raw?: (DiaSemana | string)[] | null): DiaSemana[] {
  if (!raw) return [];
  return raw
    .map((d) => normalizeDia(String(d)))
    .filter((d): d is DiaSemana => d !== null);
}

type Schedule = Horario | string | null | undefined;

function isHorarioObject(schedule: Schedule): schedule is Horario {
  return typeof schedule === 'object' && schedule !== null;
}

/** true si el horario trae un rango apertura/cierre utilizable para el cálculo estructurado. */
function hasStructuredRange(schedule: Horario): boolean {
  return Boolean(schedule.apertura && schedule.cierre);
}

/** Resuelve el modo real: explícito si viene seteado, si no se infiere de los datos presentes. */
function resolveModo(schedule: Horario): HorarioModo {
  if (schedule.modo) return schedule.modo;
  return hasStructuredRange(schedule) ? 'fijo' : 'consultar';
}

function parseHourMin(value: string): { h: number; m: number } | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
}

/** Día de la semana actual en Chile, normalizado a las claves 'lun'..'dom'. */
function currentDiaSemana(): DiaSemana {
  const raw = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'short',
  }).format(new Date());

  return normalizeDia(raw) || 'lun';
}

function currentMinutesInChile(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  let hour = 0;
  let minute = 0;
  formatter.formatToParts(new Date()).forEach((p) => {
    if (p.type === 'hour') hour = parseInt(p.value, 10) % 24;
    if (p.type === 'minute') minute = parseInt(p.value, 10);
  });
  return hour * 60 + minute;
}

/** Texto legible para mostrar en tablas y fichas, a partir de un horario estructurado o legado (string). */
export function formatHorario(schedule: Schedule): string {
  if (!schedule) return '';
  if (typeof schedule === 'string') return schedule.trim();

  const modo = resolveModo(schedule);

  if (modo === 'siempre-abierto') {
    return schedule.descripcion?.trim() || 'Abierto todo el día';
  }

  if (modo === 'consultar' || !hasStructuredRange(schedule)) {
    return (schedule.descripcion || '').trim();
  }

  // modo === 'fijo' con apertura/cierre cargados
  const diasCierre = normalizeDiasCierre(schedule.diasCierre);
  const rango = `${schedule.apertura}–${schedule.cierre} hrs`;
  const dias = diasCierre.length === 0
    ? 'Todos los días'
    : `${DIAS_SEMANA.filter((d) => !diasCierre.includes(d.key)).map((d) => d.short).join(', ')} (cerrado ${diasCierre.map((d) => DIA_LABEL[d]).join(', ')})`;

  const base = `${dias} ${rango}`;
  return schedule.descripcion ? `${base} · ${schedule.descripcion.trim()}` : base;
}

function statusFromStructured(schedule: Horario): OpeningStatus {
  const open = parseHourMin(schedule.apertura!);
  const close = parseHourMin(schedule.cierre!);
  const display = formatHorario(schedule);

  if (!open || !close) {
    return { isOpen: null, label: 'Consultar horario', badgeColor: 'gray', detail: display };
  }

  const diasCierre = normalizeDiasCierre(schedule.diasCierre);
  const today = currentDiaSemana();

  if (diasCierre.includes(today)) {
    return {
      isOpen: false,
      label: 'Cerrado',
      badgeColor: 'red',
      detail: `Cerrado los ${DIA_LABEL[today]}`,
    };
  }

  const openMinutes = open.h * 60 + open.m;
  let closeMinutes = close.h * 60 + close.m;
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60; // cierra pasada la medianoche

  let current = currentMinutesInChile();
  if (current < openMinutes) current += 24 * 60;

  if (current >= openMinutes && current <= closeMinutes) {
    return {
      isOpen: true,
      label: 'Abierto ahora',
      badgeColor: 'green',
      detail: `Cierra a las ${schedule.cierre}`,
    };
  }

  return {
    isOpen: false,
    label: 'Cerrado',
    badgeColor: 'red',
    detail: `Abre a las ${schedule.apertura}`,
  };
}

/** Heurística de respaldo por regex, solo para horarios legados guardados como texto plano (sin estructura). */
function statusFromFreeText(scheduleStr: string): OpeningStatus {
  const normalized = scheduleStr.toLowerCase().trim();

  if (
    normalized.includes('24') ||
    normalized.includes('todo el día') ||
    normalized.includes('continuo') ||
    normalized.includes('siempre')
  ) {
    return { isOpen: true, label: 'Horario continuo', badgeColor: 'green', detail: scheduleStr };
  }

  try {
    const current = currentMinutesInChile();
    const timeMatch = scheduleStr.match(/(\d{1,2})[:.](\d{2})\s*(?:-|a|–|to)\s*(\d{1,2})[:.](\d{2})/i);

    if (timeMatch) {
      const openHour = parseInt(timeMatch[1], 10);
      const openMin = parseInt(timeMatch[2], 10);
      const closeHour = parseInt(timeMatch[3], 10);
      const closeMin = parseInt(timeMatch[4], 10);

      const openMinutes = openHour * 60 + openMin;
      let closeMinutes = closeHour * 60 + closeMin;
      if (closeMinutes < openMinutes) closeMinutes += 24 * 60;

      let checkCurrent = current;
      if (current < openMinutes && closeMinutes > 24 * 60) checkCurrent += 24 * 60;

      if (checkCurrent >= openMinutes && checkCurrent <= closeMinutes) {
        return {
          isOpen: true,
          label: 'Abierto ahora',
          badgeColor: 'green',
          detail: `Cierra a las ${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`,
        };
      }
      return {
        isOpen: false,
        label: 'Cerrado',
        badgeColor: 'red',
        detail: `Abre a las ${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}`,
      };
    }
  } catch (e) {
    console.error('Error calculando horario:', e);
  }

  return { isOpen: null, label: 'Consultar horario', badgeColor: 'gray', detail: scheduleStr };
}

export function getOpeningStatus(schedule: Schedule): OpeningStatus {
  if (!schedule) {
    return { isOpen: null, label: 'Consultar horario', badgeColor: 'gray' };
  }

  if (isHorarioObject(schedule)) {
    const modo = resolveModo(schedule);

    if (modo === 'siempre-abierto') {
      return {
        isOpen: true,
        label: 'Horario continuo',
        badgeColor: 'green',
        detail: schedule.descripcion?.trim() || undefined,
      };
    }

    if (modo === 'fijo' && hasStructuredRange(schedule)) {
      return statusFromStructured(schedule);
    }

    // 'consultar', o 'fijo' sin apertura/cierre cargados todavía
    return {
      isOpen: null,
      label: 'Consultar horario',
      badgeColor: 'gray',
      detail: schedule.descripcion?.trim() || undefined,
    };
  }

  return statusFromFreeText(schedule);
}
