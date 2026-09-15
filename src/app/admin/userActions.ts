'use server';

import { prisma } from '@/lib/prisma';
import { UserRole, AdminUser } from '@/lib/types';
import { hashPassword, verifyPassword, generateTemporaryPassword } from '@/lib/auth';
import { getAdminSession, requireRole } from './authActions';

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireRole(['ADMIN']);
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      activo: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return users as unknown as AdminUser[];
}

export async function createAdminUser(data: {
  email: string;
  nombre: string;
  role: UserRole;
}): Promise<{ user: AdminUser; temporaryPassword: string }> {
  await requireRole(['ADMIN']);

  const email = data.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('El correo electrónico no es válido');
  }
  if (!data.nombre || data.nombre.trim().length === 0) {
    throw new Error('El nombre es requerido');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Ya existe un usuario con este correo electrónico');
  }

  // El admin no elige la clave del nuevo usuario: se genera una temporal que
  // deberá entregarle, y el sistema exige cambiarla en el primer ingreso.
  const temporaryPassword = generateTemporaryPassword(email);

  const user = await prisma.user.create({
    data: {
      email,
      nombre: data.nombre.trim(),
      password: hashPassword(temporaryPassword),
      role: data.role,
      activo: true,
      mustChangePassword: true,
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      activo: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { user: user as unknown as AdminUser, temporaryPassword };
}

export async function updateAdminUser(
  id: string,
  data: {
    nombre?: string;
    role?: UserRole;
    activo?: boolean;
    /** El admin no escribe la clave: pide generar una nueva temporal para este usuario. */
    resetPassword?: boolean;
  }
): Promise<{ user: AdminUser; temporaryPassword?: string }> {
  const currentSession = await requireRole(['ADMIN']);

  // Prevenir que el único admin activo se auto-desactive o se cambie a lector/editor
  if (id === currentSession.id && (data.activo === false || (data.role && data.role !== 'ADMIN'))) {
    const activeAdmins = await prisma.user.count({
      where: { role: 'ADMIN', activo: true },
    });
    if (activeAdmins <= 1) {
      throw new Error('No puedes desactivar ni cambiar el rol del único administrador activo');
    }
  }

  const updateData: any = {};
  if (data.nombre) updateData.nombre = data.nombre.trim();
  if (data.role) updateData.role = data.role;
  if (typeof data.activo === 'boolean') updateData.activo = data.activo;

  let temporaryPassword: string | undefined;
  if (data.resetPassword) {
    // Reseteo: se genera una clave temporal nueva, no la elige el admin.
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!target) throw new Error('Usuario no encontrado');
    temporaryPassword = generateTemporaryPassword(target.email);
    updateData.password = hashPassword(temporaryPassword);
    updateData.mustChangePassword = true;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      activo: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { user: user as unknown as AdminUser, temporaryPassword };
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const currentSession = await requireRole(['ADMIN']);

  if (id === currentSession.id) {
    throw new Error('No puedes eliminar tu propia cuenta de administrador');
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === 'ADMIN') {
    const activeAdmins = await prisma.user.count({
      where: { role: 'ADMIN', activo: true },
    });
    if (activeAdmins <= 1) {
      throw new Error('No puedes eliminar al único administrador del sistema');
    }
  }

  await prisma.user.delete({ where: { id } });
  return true;
}

export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session || !session.id) {
    return { success: false, error: 'Debes iniciar sesión para cambiar tu contraseña' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return { success: false, error: 'Usuario no encontrado en la base de datos' };
  }

  const isValid = verifyPassword(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: 'La contraseña actual es incorrecta' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashPassword(newPassword), mustChangePassword: false },
  });

  return { success: true };
}
