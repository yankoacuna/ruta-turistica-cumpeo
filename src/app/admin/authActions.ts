'use server';

import { prisma } from '@/lib/prisma';
import { UserRole, AdminSessionUser } from '@/lib/types';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  shouldRefreshToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

import { cookies } from 'next/headers';

export async function ensureInitialAdmin(): Promise<void> {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      const initialEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
      const initialName = process.env.INITIAL_ADMIN_NAME?.trim();
      const initialPass = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;

      if (!initialEmail || !initialName || !initialPass) {
        console.warn(
          'Variables de entorno requeridas no configuradas en .env (INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME o ADMIN_SECRET). No se pudo inicializar el usuario administrador.'
        );
        return;
      }

      await prisma.user.create({
        data: {
          email: initialEmail,
          nombre: initialName,
          password: hashPassword(initialPass),
          role: 'ADMIN',
          activo: true,
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring initial admin:', error);
  }
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  await ensureInitialAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, nombre: true, role: true, activo: true, mustChangePassword: true },
    });
    if (!user || !user.activo) {
      return null;
    }
    const sessionUser: AdminSessionUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role as UserRole,
      mustChangePassword: user.mustChangePassword,
    };

    // Renovación deslizante automática (Sliding Session) si quedan menos de 3 días
    if (shouldRefreshToken(token)) {
      try {
        const refreshedToken = createSessionToken(sessionUser);
        cookieStore.set(SESSION_COOKIE_NAME, refreshedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
      } catch {
        // En contexto de Server Component de solo lectura, cookies().set no está permitido; se ignora sin error
      }
    }

    return sessionUser;
  } catch (err) {
    console.error('Error fetching admin session user from DB:', err);
    return null;
  }
}

/**
 * Heartbeat de sesión: el cliente lo llama periódicamente mientras el usuario
 * está activo en el panel (ver useSessionHeartbeat), para que el token se
 * renueve solo (sliding session) sin depender de que se guarde algo.
 * Reutiliza getAdminSession(), que ya contiene la lógica de renovación y
 * corre en contexto de Server Action, donde cookies().set() sí está permitido.
 */
export async function pingSession(): Promise<AdminSessionUser | null> {
  return getAdminSession();
}

export async function loginAdmin(
  identifierOrPassword: string,
  passwordInput?: string
): Promise<{ success: boolean; error?: string; user?: AdminSessionUser }> {
  await ensureInitialAdmin();

  if (!passwordInput) {
    return { success: false, error: 'Contraseña o credenciales inválidas' };
  }

  const email = identifierOrPassword.trim().toLowerCase();
  const password = passwordInput;

  // Verificación regular contra base de datos
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: 'Usuario no encontrado o credenciales incorrectas' };
  }

  if (!user.activo) {
    return { success: false, error: 'Esta cuenta ha sido desactivada. Contacta al administrador.' };
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  const sessionUser: AdminSessionUser = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role as UserRole,
    mustChangePassword: user.mustChangePassword,
  };

  const token = createSessionToken(sessionUser);
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, user: sessionUser };
}

export async function logoutAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('Error in logoutAdmin:', error);
  }
  return true;
}

export async function verifyAdminSession(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

/**
 * Única puerta de autorización del panel. La sesión sale exclusivamente de la
 * cookie firmada: no existe ninguna clave maestra ni token de rescate que la
 * sustituya, porque un secreto aceptado por parámetro es un secreto que
 * cualquiera puede mandar desde fuera.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AdminSessionUser> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('No autorizado: Inicia sesión para continuar');
  }

  if (!allowedRoles.includes(session.role)) {
    throw new Error(
      `Acceso denegado: Tu rol (${session.role}) no tiene autorización para realizar esta acción`
    );
  }

  return session;
}

export async function assertAuthorized() {
  return requireRole(['ADMIN', 'EDITOR']);
}
