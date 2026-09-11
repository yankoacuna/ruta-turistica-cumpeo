import crypto from 'crypto';
import { AdminSessionUser } from './types';

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('Variable ADMIN_SECRET o ADMIN_PASSWORD no configurada en el archivo .env');
  }
  return secret;
}

export const SESSION_COOKIE_NAME = 'admin_session_token';

/**
 * Genera un hash seguro con salt usando crypto.scryptSync nativo de Node.js
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Valida una contraseña contra un hash guardado (formato salt:hash)
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    if (!salt || !originalHash) return false;

    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const originalBuffer = Buffer.from(originalHash, 'hex');

    if (keyBuffer.length !== originalBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, originalBuffer);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Genera una contraseña temporal a partir del usuario del correo (parte antes
 * de la @) más 4 dígitos al azar, para que sea fácil de leer y transcribir al
 * entregarla por teléfono o WhatsApp. Es intencionalmente simple: solo dura
 * hasta el primer inicio de sesión, donde el sistema exige cambiarla (ver
 * mustChangePassword), así que la ventana de exposición es mínima.
 */
export function generateTemporaryPassword(email: string): string {
  const localPart = (email.split('@')[0] || 'usuario').toLowerCase().replace(/[^a-z0-9]/g, '');
  const digits = crypto.randomInt(1000, 10000);
  return `${localPart || 'usuario'}${digits}`;
}

export interface SessionTokenPayload extends AdminSessionUser {
  iat?: number;
  exp?: number;
}

/**
 * Crea un token de sesión firmado para el usuario con expiración de 7 días
 */
export function createSessionToken(user: AdminSessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const payloadData: SessionTokenPayload = {
    ...user,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 días de validez
  };
  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  const secret = getSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Valida la firma del token y retorna los datos del usuario en sesión
 */
export function verifySessionToken(token: string): AdminSessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    if (!payload || !signature) return null;

    const secret = getSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;

    const jsonStr = Buffer.from(payload, 'base64url').toString('utf8');
    const user = JSON.parse(jsonStr) as SessionTokenPayload;

    if (!user || !user.id || !user.role) return null;

    // Verificar si el token ha expirado
    if (user.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now > user.exp) {
        return null;
      }
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Determina si el token de sesión está próximo a expirar (menos de 3 días restantes)
 * para realizar una renovación deslizante automática (Sliding Session).
 */
export function shouldRefreshToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload] = parts;
    if (!payload) return false;

    const jsonStr = Buffer.from(payload, 'base64url').toString('utf8');
    const user = JSON.parse(jsonStr) as SessionTokenPayload;

    if (!user || !user.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = user.exp - now;

    // Renovar si le quedan menos de 3 días (3 * 86400 = 259200 segundos)
    return remainingSeconds < 3 * 24 * 60 * 60;
  } catch {
    return false;
  }
}
