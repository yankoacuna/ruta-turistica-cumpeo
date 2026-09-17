'use server';

import { prisma } from '@/lib/prisma';
import { UserRole, AdminSessionUser } from '@/lib/types';
import { Resultado, exito, fallo } from '@/lib/resultado';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  shouldRefreshToken,
  SESSION_COOKIE_NAME,
  SESION_DURACION_SEGUNDOS,
} from '@/lib/auth';

import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';

// Freno de fuerza bruta al login: mismo patrón que ya usan los formularios
// públicos (/api/solicitudes, /api/solicitudes/foto) contra su propio abuso,
// aplicado acá porque el login era la única puerta del panel sin ningún
// límite de intentos.
//
// x-forwarded-for lo puede mandar el propio cliente y este hosting no tiene
// (todavía) un proxy que lo reescriba con el IP real, así que no es
// confiable: alguien podría rotarlo en cada intento y resetear el freno por
// IP. Por eso el límite real es el de CUENTA (solo el email, sin IP) — ese no
// se puede eludir cambiando encabezados. El límite por IP+email queda como
// capa extra para cuando el encabezado sí es honesto.
const VENTANA_INTENTOS_MS = 15 * 60 * 1000;
const MAX_INTENTOS_FALLIDOS_IP = 8;
const MAX_INTENTOS_FALLIDOS_CUENTA = 20;
const intentosFallidos = new Map<string, { cuenta: number; expira: number }>();

/** Mensaje único para todo fallo de credenciales: no revela si el correo existe. */
const ERROR_CREDENCIALES = 'Correo o contraseña incorrectos.';

/**
 * Hash contra el que se verifica cuando el correo no existe, para que la
 * respuesta tarde lo mismo que con una cuenta real: la diferencia de tiempo
 * delataría qué correos están registrados. Se calcula una vez al arrancar el
 * proceso, sobre un valor aleatorio.
 */
const HASH_SENUELO = hashPassword(crypto.randomBytes(32).toString('hex'));

async function ipDelPedido(): Promise<string> {
  const headersList = await headers();
  const reenviada = headersList.get('x-forwarded-for');
  if (reenviada) return reenviada.split(',')[0].trim();
  return headersList.get('x-real-ip') || 'desconocida';
}

function superaLimiteIntentos(clave: string, max: number): boolean {
  const ahora = Date.now();
  const registro = intentosFallidos.get(clave);
  return !!registro && registro.expira > ahora && registro.cuenta >= max;
}

function registrarIntentoFallido(clave: string): void {
  const ahora = Date.now();

  if (intentosFallidos.size > 500) {
    for (const [k, r] of intentosFallidos) {
      if (r.expira <= ahora) intentosFallidos.delete(k);
    }
  }

  const registro = intentosFallidos.get(clave);
  if (!registro || registro.expira <= ahora) {
    intentosFallidos.set(clave, { cuenta: 1, expira: ahora + VENTANA_INTENTOS_MS });
  } else {
    registro.cuenta += 1;
  }
}

function limpiarIntentosFallidos(clave: string): void {
  intentosFallidos.delete(clave);
}

/**
 * El primer administrador se crea con `node prisma/seed.js` (ver ese
 * archivo), no en tiempo de ejecución.
 */

/** Firma un token nuevo con la versión de clave vigente y lo deja en la cookie. */
export async function emitirCookieSesion(user: AdminSessionUser, tokenVersion: number): Promise<void> {
  const token = createSessionToken(user, tokenVersion);
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESION_DURACION_SEGUNDOS,
  });
}

/** Deduplicada con cache(): una carga de /admin la llama varias veces en paralelo. */
const leerSesionDesdeCookie = cache(async (): Promise<AdminSessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true, email: true, nombre: true, role: true, activo: true,
        mustChangePassword: true, tokenVersion: true,
      },
    });
    if (!user || !user.activo || user.tokenVersion !== session.tokenVersion) {
      return null;
    }
    const sessionUser: AdminSessionUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role as UserRole,
      mustChangePassword: user.mustChangePassword,
    };

    // Renovación deslizante automática (Sliding Session)
    if (shouldRefreshToken(token)) {
      try {
        await emitirCookieSesion(sessionUser, user.tokenVersion);
      } catch {
        // En contexto de Server Component de solo lectura, cookies().set no está permitido; se ignora sin error
      }
    }

    return sessionUser;
  } catch (err) {
    console.error('Error fetching admin session user from DB:', err);
    return null;
  }
});

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  return leerSesionDesdeCookie();
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
  if (!passwordInput) {
    return { success: false, error: 'Contraseña o credenciales inválidas' };
  }

  const email = identifierOrPassword.trim().toLowerCase();
  const password = passwordInput;
  const claveIp = `${await ipDelPedido()}|${email}`;
  const claveCuenta = email;

  if (
    superaLimiteIntentos(claveIp, MAX_INTENTOS_FALLIDOS_IP) ||
    superaLimiteIntentos(claveCuenta, MAX_INTENTOS_FALLIDOS_CUENTA)
  ) {
    return {
      success: false,
      error: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.',
    };
  }

  // Verificación regular contra base de datos
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Mismo costo que una cuenta real; el resultado se descarta.
    verifyPassword(password, HASH_SENUELO);
    registrarIntentoFallido(claveIp);
    registrarIntentoFallido(claveCuenta);
    return { success: false, error: ERROR_CREDENCIALES };
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    registrarIntentoFallido(claveIp);
    registrarIntentoFallido(claveCuenta);
    return { success: false, error: ERROR_CREDENCIALES };
  }

  // Solo se informa a quien acertó la contraseña.
  if (!user.activo) {
    return { success: false, error: 'Esta cuenta está desactivada. Contacta al administrador.' };
  }

  limpiarIntentosFallidos(claveIp);
  limpiarIntentosFallidos(claveCuenta);

  const sessionUser: AdminSessionUser = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role as UserRole,
    mustChangePassword: user.mustChangePassword,
  };

  await emitirCookieSesion(sessionUser, user.tokenVersion);

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

  // changeOwnPassword no pasa por esta función, de modo que cambiar la clave
  // sigue siendo posible con una sesión en este estado.
  if (session.mustChangePassword) {
    throw new Error(
      'No autorizado: Debes cambiar tu contraseña temporal antes de continuar'
    );
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

/** Nombre del rol tal como lo ve el funcionario, no la constante del código. */
const ROL_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  LECTOR: 'Lector',
};

/**
 * Autorización para las acciones que el panel invoca desde el navegador:
 * devuelve el resultado en vez de lanzar, porque el mensaje de una excepción de
 * server action no llega al navegador en producción (ver src/lib/resultado.ts).
 *
 * requireRole es la variante para las lecturas que solo ocurren en el servidor,
 * como las que arman /admin.
 */
export async function sesionConRol(
  rolesPermitidos: UserRole[]
): Promise<Resultado<AdminSessionUser>> {
  const session = await getAdminSession();

  if (!session) {
    return fallo('NO_AUTORIZADO', 'Tu sesión venció. Vuelve a iniciar sesión para continuar.');
  }

  if (session.mustChangePassword) {
    return fallo(
      'CAMBIO_CLAVE_PENDIENTE',
      'Debes cambiar tu contraseña temporal antes de seguir trabajando.'
    );
  }

  if (!rolesPermitidos.includes(session.role)) {
    return fallo(
      'ROL_INSUFICIENTE',
      `Tu rol (${ROL_LABEL[session.role]}) no tiene permiso para realizar esta acción.`
    );
  }

  return exito(session);
}
