import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  generateTemporaryPassword,
  createSessionToken,
  verifySessionToken,
  shouldRefreshToken,
  SESION_DURACION_SEGUNDOS,
} from './auth';
import type { AdminSessionUser } from './types';

const usuario: AdminSessionUser = {
  id: 'user-1',
  email: 'admin@turismocumpeo.cl',
  nombre: 'Admin',
  role: 'ADMIN',
};

describe('hashPassword / verifyPassword', () => {
  it('una contraseña correcta verifica contra su propio hash', () => {
    const hash = hashPassword('unaClaveSegura123');
    expect(verifyPassword('unaClaveSegura123', hash)).toBe(true);
  });

  it('una contraseña incorrecta no verifica', () => {
    const hash = hashPassword('unaClaveSegura123');
    expect(verifyPassword('otraClaveDistinta', hash)).toBe(false);
  });

  it('dos hashes de la misma contraseña son distintos (salt aleatorio)', () => {
    const a = hashPassword('repetida');
    const b = hashPassword('repetida');
    expect(a).not.toBe(b);
    expect(verifyPassword('repetida', a)).toBe(true);
    expect(verifyPassword('repetida', b)).toBe(true);
  });

  it('un hash con formato inválido no rompe, solo falla la verificación', () => {
    expect(verifyPassword('cualquiera', 'esto-no-es-un-hash-valido')).toBe(false);
    expect(verifyPassword('cualquiera', '')).toBe(false);
    expect(verifyPassword('cualquiera', 'sololasal:')).toBe(false);
  });
});

describe('generateTemporaryPassword', () => {
  it('arma el prefijo desde la parte local del correo, sin caracteres especiales', () => {
    const clave = generateTemporaryPassword('maria.perez@ejemplo.cl');
    expect(clave.startsWith('mariaperez-')).toBe(true);
  });

  it('trunca el prefijo a 12 caracteres si la parte local es más larga', () => {
    const clave = generateTemporaryPassword('patricia.navarro.contreras@ejemplo.cl');
    expect(clave.startsWith('patricianava-')).toBe(true);
  });

  it('tiene tres grupos de 4 caracteres del alfabeto sin ambigüedades', () => {
    const clave = generateTemporaryPassword('ana@ejemplo.cl');
    const partes = clave.split('-');
    expect(partes).toHaveLength(4); // prefijo + 3 grupos
    for (const grupo of partes.slice(1)) {
      expect(grupo).toHaveLength(4);
      expect(grupo).toMatch(/^[A-HJ-NP-Z2-9]+$/); // sin 0, O, 1, I, L
    }
  });

  it('si el correo no tiene parte local usable, usa "usuario" como prefijo', () => {
    const clave = generateTemporaryPassword('@ejemplo.cl');
    expect(clave.startsWith('usuario-')).toBe(true);
  });

  it('dos llamadas seguidas no generan la misma clave', () => {
    const a = generateTemporaryPassword('ana@ejemplo.cl');
    const b = generateTemporaryPassword('ana@ejemplo.cl');
    expect(a).not.toBe(b);
  });
});

describe('createSessionToken / verifySessionToken', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('un token recién creado verifica con los mismos datos del usuario', () => {
    const token = createSessionToken(usuario, 3);
    const verificado = verifySessionToken(token);
    expect(verificado).toMatchObject({ ...usuario, tokenVersion: 3 });
  });

  it('un token con la firma alterada no verifica', () => {
    const token = createSessionToken(usuario, 0);
    const [payload] = token.split('.');
    const falsificado = `${payload}.${'0'.repeat(64)}`;
    expect(verifySessionToken(falsificado)).toBeNull();
  });

  it('un token con el payload alterado no verifica (la firma ya no calza)', () => {
    const token = createSessionToken(usuario, 0);
    const [, firma] = token.split('.');
    const payloadFalso = Buffer.from(JSON.stringify({ ...usuario, role: 'ADMIN', id: 'otro-usuario' })).toString(
      'base64url'
    );
    expect(verifySessionToken(`${payloadFalso}.${firma}`)).toBeNull();
  });

  it('un token mal formado (sin punto separador) no verifica', () => {
    expect(verifySessionToken('token-sin-formato')).toBeNull();
  });

  it('un token expirado no verifica', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = createSessionToken(usuario, 0);

    vi.setSystemTime(new Date('2026-01-01T00:00:00Z').getTime() + (SESION_DURACION_SEGUNDOS + 1) * 1000);
    expect(verifySessionToken(token)).toBeNull();
  });

  it('un token sin tokenVersion (formato antiguo) equivale a versión 0', () => {
    const now = Math.floor(Date.now() / 1000);
    const payloadSinVersion = Buffer.from(
      JSON.stringify({ ...usuario, iat: now, exp: now + 3600 })
    ).toString('base64url');
    const secret = process.env.SESSION_SECRET!;
    const firma = crypto.createHmac('sha256', secret).update(payloadSinVersion).digest('hex');

    const verificado = verifySessionToken(`${payloadSinVersion}.${firma}`);
    expect(verificado?.tokenVersion).toBe(0);
  });
});

describe('shouldRefreshToken', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('no hace falta renovar un token recién creado', () => {
    const token = createSessionToken(usuario, 0);
    expect(shouldRefreshToken(token)).toBe(false);
  });

  it('hace falta renovar cuando falta menos del umbral para expirar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = createSessionToken(usuario, 0);

    // Adelantar el reloj a menos de un día de la expiración (umbral = 1 día).
    vi.setSystemTime(
      new Date('2026-01-01T00:00:00Z').getTime() + (SESION_DURACION_SEGUNDOS - 60 * 60) * 1000
    );
    expect(shouldRefreshToken(token)).toBe(true);
  });

  it('un token mal formado no revienta, simplemente no pide renovar', () => {
    expect(shouldRefreshToken('esto-no-es-un-token')).toBe(false);
  });
});
