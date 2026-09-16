import { describe, it, expect, afterEach, vi } from 'vitest';
import { formatHorario, getOpeningStatus } from './openingHours';
import type { Horario } from './types';

/** Fija la hora "actual" en un instante conocido, en horario de invierno de Chile (UTC-4, sin DST). */
function fijarHoraChile(fechaIso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(fechaIso));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('formatHorario', () => {
  it('devuelve vacío sin horario', () => {
    expect(formatHorario(null)).toBe('');
    expect(formatHorario(undefined)).toBe('');
  });

  it('devuelve el texto tal cual para horarios legados en string', () => {
    expect(formatHorario('  Todos los días, 9 a 18 hrs  ')).toBe('Todos los días, 9 a 18 hrs');
  });

  it('modo siempre-abierto usa la descripción o un texto por defecto', () => {
    const h: Horario = { modo: 'siempre-abierto' };
    expect(formatHorario(h)).toBe('Abierto todo el día');
    expect(formatHorario({ modo: 'siempre-abierto', descripcion: 'Abierto 24/7' })).toBe('Abierto 24/7');
  });

  it('modo consultar devuelve solo la descripción', () => {
    expect(formatHorario({ modo: 'consultar', descripcion: 'Llamar para coordinar' })).toBe(
      'Llamar para coordinar'
    );
  });

  it('modo fijo sin días de cierre dice "Todos los días"', () => {
    const h: Horario = { modo: 'fijo', apertura: '09:00', cierre: '18:00' };
    expect(formatHorario(h)).toBe('Todos los días 09:00–18:00 hrs');
  });

  it('modo fijo con días de cierre los excluye del listado', () => {
    const h: Horario = { modo: 'fijo', apertura: '09:00', cierre: '18:00', diasCierre: ['lun', 'mar'] };
    expect(formatHorario(h)).toBe('Mié, Jue, Vie, Sáb, Dom (cerrado Lun, Mar) 09:00–18:00 hrs');
  });

  it('acepta nombres completos de día, sin distinguir mayúsculas', () => {
    // diasCierre admite en runtime nombres completos o alias, no solo las claves cortas.
    const h = {
      modo: 'fijo',
      apertura: '09:00',
      cierre: '18:00',
      diasCierre: ['lunes', 'MAR'],
    } as unknown as Horario;
    expect(formatHorario(h)).toBe('Mié, Jue, Vie, Sáb, Dom (cerrado Lun, Mar) 09:00–18:00 hrs');
  });

  it('agrega la descripción al final si viene junto al horario fijo', () => {
    const h: Horario = { modo: 'fijo', apertura: '09:00', cierre: '18:00', descripcion: 'Solo temporada alta' };
    expect(formatHorario(h)).toBe('Todos los días 09:00–18:00 hrs · Solo temporada alta');
  });
});

describe('getOpeningStatus', () => {
  it('sin horario, pide consultar', () => {
    expect(getOpeningStatus(null)).toEqual({ isOpen: null, label: 'Consultar horario', badgeColor: 'gray' });
  });

  it('siempre-abierto está abierto sin importar la hora', () => {
    fijarHoraChile('2026-07-15T03:00:00Z'); // 2026-07-14 23:00 en Chile (invierno, UTC-4)
    const status = getOpeningStatus({ modo: 'siempre-abierto' });
    expect(status.isOpen).toBe(true);
    expect(status.label).toBe('Horario continuo');
  });

  it('horario fijo: abierto dentro del rango', () => {
    // 2026-07-15 es miércoles. 14:00 UTC = 10:00 en Chile (invierno, UTC-4).
    fijarHoraChile('2026-07-15T14:00:00Z');
    const status = getOpeningStatus({ modo: 'fijo', apertura: '09:00', cierre: '18:00' });
    expect(status).toMatchObject({ isOpen: true, label: 'Abierto ahora', badgeColor: 'green' });
  });

  it('horario fijo: cerrado fuera del rango', () => {
    // 22:00 UTC = 18:00 en Chile, ya cerró (cierre a las 18:00, inclusive el borde no cuenta como cerrado
    // recién al minuto siguiente) -> se usa 23:00 UTC = 19:00 Chile, claramente cerrado.
    fijarHoraChile('2026-07-15T23:00:00Z');
    const status = getOpeningStatus({ modo: 'fijo', apertura: '09:00', cierre: '18:00' });
    expect(status).toMatchObject({ isOpen: false, label: 'Cerrado' });
  });

  it('horario fijo: respeta el horario de verano chileno (UTC-3)', () => {
    // 2026-01-15 es jueves, pleno verano en Chile (DST activo, UTC-3).
    // 13:00 UTC = 10:00 en Chile -> dentro de 09:00-18:00.
    fijarHoraChile('2026-01-15T13:00:00Z');
    const status = getOpeningStatus({ modo: 'fijo', apertura: '09:00', cierre: '18:00' });
    expect(status.isOpen).toBe(true);
  });

  it('horario fijo: día de cierre semanal gana aunque la hora esté dentro del rango', () => {
    // 2026-07-15 es miércoles, 10:00 en Chile.
    fijarHoraChile('2026-07-15T14:00:00Z');
    const status = getOpeningStatus({
      modo: 'fijo',
      apertura: '09:00',
      cierre: '18:00',
      diasCierre: ['mie'],
    });
    expect(status).toMatchObject({ isOpen: false, label: 'Cerrado', detail: 'Cerrado los Mié' });
  });

  it('horario fijo que cierra pasada la medianoche', () => {
    // 02:00 en Chile (invierno) cae dentro de un rango 20:00-02:00.
    fijarHoraChile('2026-07-15T06:00:00Z'); // 06:00 UTC = 02:00 Chile
    const status = getOpeningStatus({ modo: 'fijo', apertura: '20:00', cierre: '02:00' });
    expect(status.isOpen).toBe(true);
  });

  it('horario fijo sin apertura/cierre cargados pide consultar', () => {
    const status = getOpeningStatus({ modo: 'fijo' });
    expect(status).toEqual({ isOpen: null, label: 'Consultar horario', badgeColor: 'gray', detail: undefined });
  });

  it('texto libre: detecta "24 horas" como horario continuo', () => {
    expect(getOpeningStatus('Abierto las 24 horas').label).toBe('Horario continuo');
  });

  it('texto libre: calcula apertura/cierre con una expresión simple', () => {
    fijarHoraChile('2026-07-15T14:00:00Z'); // 10:00 Chile
    const status = getOpeningStatus('Lunes a viernes de 09:00 a 18:00');
    expect(status).toMatchObject({ isOpen: true, label: 'Abierto ahora' });
  });

  it('texto libre sin un patrón reconocible pide consultar', () => {
    const status = getOpeningStatus('Coordinar por WhatsApp');
    expect(status).toEqual({ isOpen: null, label: 'Consultar horario', badgeColor: 'gray', detail: 'Coordinar por WhatsApp' });
  });
});
