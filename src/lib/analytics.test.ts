import { describe, it, expect, afterEach, vi } from 'vitest';
import { seccionDesdePath, resolverRango } from './analytics';

describe('seccionDesdePath', () => {
  it('mapea la raíz a "inicio"', () => {
    expect(seccionDesdePath('/')).toBe('inicio');
    expect(seccionDesdePath('')).toBe('inicio');
  });

  it('mapea los prefijos conocidos', () => {
    expect(seccionDesdePath('/destino/plaza-de-cumpeo')).toBe('destino');
    expect(seccionDesdePath('/ruta/circuito-condorito')).toBe('ruta');
    expect(seccionDesdePath('/mapa')).toBe('mapa');
    expect(seccionDesdePath('/categoria/cultural')).toBe('categoria');
    expect(seccionDesdePath('/historia')).toBe('historia');
    expect(seccionDesdePath('/contacto')).toBe('contacto');
  });

  it('lo desconocido cae en "otro"', () => {
    expect(seccionDesdePath('/sumate')).toBe('otro');
    expect(seccionDesdePath('/admin')).toBe('otro');
  });

  it('ignora querystring y hash antes de decidir la sección', () => {
    expect(seccionDesdePath('/destino/plaza-de-cumpeo?utm_source=qr')).toBe('destino');
    expect(seccionDesdePath('/mapa#zoom=15')).toBe('mapa');
  });
});

describe('resolverRango', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('"hoy" da granularidad por hora con 24 tramos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:00:00Z')); // 10:00 en Chile (invierno)
    const rango = resolverRango('hoy');
    expect(rango.granularidad).toBe('hora');
    expect(rango.claves).toHaveLength(24);
    expect(rango.claves[0]).toBe('2026-07-15T00');
  });

  it('"7d" da 7 tramos diarios terminando hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:00:00Z'));
    const rango = resolverRango('7d');
    expect(rango.granularidad).toBe('dia');
    expect(rango.claves).toHaveLength(7);
    expect(rango.claves[6]).toBe('2026-07-15');
    expect(rango.claves[0]).toBe('2026-07-09');
  });

  it('"mes-actual" solo incluye los días transcurridos del mes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-10T14:00:00Z'));
    const rango = resolverRango('mes-actual');
    expect(rango.claves).toHaveLength(10);
    expect(rango.claves[0]).toBe('2026-07-01');
    expect(rango.claves[9]).toBe('2026-07-10');
  });

  it('"mes-pasado" cruza el cambio de año en enero', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T14:00:00Z'));
    const rango = resolverRango('mes-pasado');
    expect(rango.label).toBe('Diciembre 2025');
    expect(rango.claves[0]).toBe('2025-12-01');
    expect(rango.claves.at(-1)).toBe('2025-12-31');
  });

  it('"personalizado" de un solo día usa granularidad por hora', () => {
    const rango = resolverRango('personalizado', '2026-03-01', '2026-03-01');
    expect(rango.granularidad).toBe('hora');
    expect(rango.claves).toHaveLength(24);
  });

  it('"personalizado" acepta las fechas en cualquier orden', () => {
    const rango = resolverRango('personalizado', '2026-03-05', '2026-03-01');
    expect(rango.claves[0]).toBe('2026-03-01');
    expect(rango.claves.at(-1)).toBe('2026-03-05');
  });

  it('"personalizado" con fechas inválidas cae a los últimos 30 días', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:00:00Z'));
    const rango = resolverRango('personalizado', '31-02-2026', 'no-es-fecha');
    expect(rango.label).toBe('Últimos 30 días');
    expect(rango.claves).toHaveLength(30);
  });

  it('"personalizado" con un rango mayor a un año también cae a los últimos 30 días', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:00:00Z'));
    const rango = resolverRango('personalizado', '2020-01-01', '2026-01-01');
    expect(rango.label).toBe('Últimos 30 días');
  });

  it('preset desconocido cae a los últimos 30 días', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:00:00Z'));
    // @ts-expect-error preset inválido a propósito, para probar el fallback
    const rango = resolverRango('no-existe');
    expect(rango.label).toBe('Últimos 30 días');
    expect(rango.claves).toHaveLength(30);
  });
});
