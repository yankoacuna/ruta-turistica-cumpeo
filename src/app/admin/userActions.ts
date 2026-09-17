'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminUser } from '@/lib/types';
import { hashPassword, verifyPassword, generateTemporaryPassword } from '@/lib/auth';
import { Resultado, exito, fallo } from '@/lib/resultado';
import {
  UsuarioNuevoSchema,
  UsuarioEdicionSchema,
  CambioClaveSchema,
  detallesDeZod,
} from '@/lib/esquemas';
import { getAdminSession, sesionConRol, emitirCookieSesion } from './authActions';

/** Campos del usuario que el panel puede ver; nunca incluye el hash de la contraseña. */
const CAMPOS_PUBLICOS = {
  id: true,
  email: true,
  nombre: true,
  role: true,
  activo: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getAdminUsers(): Promise<Resultado<AdminUser[]>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  const users = await prisma.user.findMany({
    select: CAMPOS_PUBLICOS,
    orderBy: { createdAt: 'asc' },
  });
  return exito(users as unknown as AdminUser[]);
}

export async function createAdminUser(data: {
  email: string;
  nombre: string;
  role: AdminUser['role'];
}): Promise<Resultado<{ user: AdminUser; temporaryPassword: string }>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  const validado = UsuarioNuevoSchema.safeParse(data ?? {});
  if (!validado.success) {
    return fallo(
      'VALIDACION',
      'Revisa los datos del usuario.',
      detallesDeZod(validado.error)
    );
  }
  const { email, nombre, role } = validado.data;

  const existente = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existente) {
    return fallo('CONFLICTO', 'Ya existe un usuario con este correo electrónico.', {
      email: 'Este correo ya está registrado',
    });
  }

  // El admin no elige la clave del nuevo usuario: se genera una temporal que
  // deberá entregarle, y el sistema exige cambiarla en el primer ingreso.
  const temporaryPassword = generateTemporaryPassword(email);

  const user = await prisma.user.create({
    data: {
      email,
      nombre,
      password: hashPassword(temporaryPassword),
      role,
      activo: true,
      mustChangePassword: true,
    },
    select: CAMPOS_PUBLICOS,
  });

  return exito({ user: user as unknown as AdminUser, temporaryPassword });
}

export async function updateAdminUser(
  id: string,
  data: {
    nombre?: string;
    role?: AdminUser['role'];
    activo?: boolean;
    /** El admin no escribe la clave: pide generar una nueva temporal para este usuario. */
    resetPassword?: boolean;
  }
): Promise<Resultado<{ user: AdminUser; temporaryPassword?: string }>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;
  const actual = sesion.data;

  const validado = UsuarioEdicionSchema.safeParse(data ?? {});
  if (!validado.success) {
    return fallo('VALIDACION', 'Revisa los datos del usuario.', detallesDeZod(validado.error));
  }
  const cambios = validado.data;

  // El sistema no puede quedarse sin ningún administrador activo.
  if (id === actual.id && (cambios.activo === false || (cambios.role && cambios.role !== 'ADMIN'))) {
    const adminsActivos = await prisma.user.count({ where: { role: 'ADMIN', activo: true } });
    if (adminsActivos <= 1) {
      return fallo(
        'CONFLICTO',
        'No puedes desactivar ni cambiar el rol del único administrador activo.'
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (cambios.nombre) updateData.nombre = cambios.nombre;
  if (cambios.role) updateData.role = cambios.role;
  if (typeof cambios.activo === 'boolean') updateData.activo = cambios.activo;

  let temporaryPassword: string | undefined;
  if (cambios.resetPassword) {
    const destino = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!destino) {
      return fallo('NO_ENCONTRADO', 'Ese usuario ya no existe.');
    }
    temporaryPassword = generateTemporaryPassword(destino.email);
    updateData.password = hashPassword(temporaryPassword);
    updateData.mustChangePassword = true;
    updateData.tokenVersion = { increment: 1 };
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: CAMPOS_PUBLICOS,
    });
    return exito({ user: user as unknown as AdminUser, temporaryPassword });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return fallo('NO_ENCONTRADO', 'Ese usuario ya no existe.');
    }
    throw error;
  }
}

export async function deleteAdminUser(id: string): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN']);
  if (!sesion.ok) return sesion;

  if (id === sesion.data.id) {
    return fallo('CONFLICTO', 'No puedes eliminar tu propia cuenta de administrador.');
  }

  const destino = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!destino) {
    return fallo('NO_ENCONTRADO', 'Ese usuario ya no existe.');
  }

  if (destino.role === 'ADMIN') {
    const adminsActivos = await prisma.user.count({ where: { role: 'ADMIN', activo: true } });
    if (adminsActivos <= 1) {
      return fallo('CONFLICTO', 'No puedes eliminar al único administrador del sistema.');
    }
  }

  await prisma.user.delete({ where: { id } });
  return exito(true);
}

/**
 * Cambio de contraseña del propio usuario.
 *
 * No pasa por sesionConRol: es la única acción que debe seguir disponible
 * cuando la sesión arrastra una contraseña temporal sin cambiar.
 */
export async function changeOwnPassword(
  actual: string,
  nueva: string
): Promise<Resultado<true>> {
  const session = await getAdminSession();
  if (!session?.id) {
    return fallo('NO_AUTORIZADO', 'Tu sesión venció. Vuelve a iniciar sesión para continuar.');
  }

  const validado = CambioClaveSchema.safeParse({ actual, nueva });
  if (!validado.success) {
    return fallo('VALIDACION', 'Revisa las contraseñas.', detallesDeZod(validado.error));
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return fallo('NO_ENCONTRADO', 'Tu usuario ya no existe en la base de datos.');
  }

  if (!verifyPassword(validado.data.actual, user.password)) {
    return fallo('VALIDACION', 'La contraseña actual es incorrecta.', {
      actual: 'No coincide con tu contraseña',
    });
  }

  const actualizado = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashPassword(validado.data.nueva),
      mustChangePassword: false,
      tokenVersion: { increment: 1 },
    },
  });

  await emitirCookieSesion(session, actualizado.tokenVersion);

  return exito(true);
}
