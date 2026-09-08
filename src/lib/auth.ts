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
 * Crea un token de sesión firmado para el usuario
 */
export function createSessionToken(user: AdminSessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
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
    const user = JSON.parse(jsonStr) as AdminSessionUser;

    if (!user || !user.id || !user.role) return null;
    return user;
  } catch (error) {
    return null;
  }
}
