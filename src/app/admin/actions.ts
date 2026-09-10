'use server';

import { prisma } from '@/lib/prisma';
import { Destination, Restaurant, Accommodation, CumpeoEvent, TourRoute, UserRole, AdminUser, AdminSessionUser, OrderableEntity } from '@/lib/types';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, shouldRefreshToken, generateTemporaryPassword, SESSION_COOKIE_NAME } from '@/lib/auth';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;

/**
 * Próximo valor de `orden` para una ficha nueva: el mayor actual + 1.
 * Sin esto, una ficha nueva nace en 0 y salta al primer lugar de la portada,
 * por delante de todo lo que el municipio ya ordenó a mano.
 */
async function nextOrden(
  model: 'destination' | 'restaurant' | 'accommodation' | 'event'
): Promise<number> {
  const agg = await (prisma[model] as any).aggregate({ _max: { orden: true } });
  return (agg._max.orden ?? -1) + 1;
}

// ─── AUTHENTICATION HELPERS & ROLE MANAGEMENT ───────────────────────────────

/**
 * Obtiene el usuario administrador de rescate buscando en la base de datos o en .env.
 * No utiliza valores fijos ni hardcodeados como fallback.
 */
async function getMasterAdminUser(): Promise<AdminSessionUser | null> {
  const dbAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN', activo: true } });
  if (dbAdmin) {
    return {
      id: dbAdmin.id,
      email: dbAdmin.email,
      nombre: dbAdmin.nombre,
      role: 'ADMIN',
    };
  }

  const envEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const envName = process.env.INITIAL_ADMIN_NAME?.trim();

  if (envEmail && envName) {
    return {
      id: 'master-admin',
      email: envEmail,
      nombre: envName,
      role: 'ADMIN',
    };
  }

  return null;
}

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
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  // Compatibilidad con token legado simple (si coincide con ADMIN_SECRET)
  if (ADMIN_SECRET) {
    const legacyToken = crypto.createHmac('sha256', ADMIN_SECRET).update('cumpeo_admin_logged_in').digest('hex');
    if (token === legacyToken) {
      return await getMasterAdminUser();
    }
  }

  const session = verifySessionToken(token);
  if (!session) return null;

  if (session.id === 'master-admin') {
    return session;
  }

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

  const validMasterPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

  // Caso 1: Clave maestra de rescate ingresada directamente
  if (!passwordInput) {
    if (validMasterPassword && (identifierOrPassword === validMasterPassword || identifierOrPassword === ADMIN_SECRET)) {
      const masterUser = await getMasterAdminUser();
      if (!masterUser) {
        return {
          success: false,
          error: 'Credencial maestra válida, pero no existe usuario administrador en el sistema ni variables en .env.',
        };
      }
      const token = createSessionToken(masterUser);
      cookies().set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return { success: true, user: masterUser };
    }
    return { success: false, error: 'Contraseña o credenciales inválidas' };
  }

  // Caso 2: Email + Contraseña
  const email = identifierOrPassword.trim().toLowerCase();
  const password = passwordInput;

  // Verificación con clave maestra de rescate
  if (validMasterPassword && (password === validMasterPassword || password === ADMIN_SECRET)) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: 'ADMIN', activo: true } });
    }

    let sessionUser: AdminSessionUser | null = null;
    if (user) {
      sessionUser = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role as UserRole,
        mustChangePassword: user.mustChangePassword,
      };
    } else {
      sessionUser = await getMasterAdminUser();
    }

    if (!sessionUser) {
      return {
        success: false,
        error: 'No se encontró un usuario administrador registrado ni configurado en el archivo .env.',
      };
    }

    const token = createSessionToken(sessionUser);
    cookies().set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: sessionUser };
  }

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
  cookies().set(SESSION_COOKIE_NAME, token, {
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
    const cookieStore = cookies();
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

export async function requireRole(
  allowedRoles: UserRole[],
  token?: string
): Promise<AdminSessionUser> {
  const masterPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;
  if (token && masterPass && (token === masterPass || token === ADMIN_SECRET)) {
    const masterUser = await getMasterAdminUser();
    if (!masterUser) {
      throw new Error(
        'Acceso denegado: No se encontró usuario administrador en la base de datos ni variables de administrador en .env'
      );
    }
    return masterUser;
  }

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

export async function assertAuthorized(token?: string) {
  return requireRole(['ADMIN', 'EDITOR'], token);
}

// ─── DESTINATIONS ─────────────────────────────────────────────────────────────

export async function saveDestination(
  tokenOrData: string | Partial<Destination>,
  maybeData?: Partial<Destination>
) {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const data = typeof tokenOrData === 'string' ? maybeData || {} : tokenOrData;

  await assertAuthorized(token);
  const slug =
    data.slug ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-dest';
  const id = data.id || slug;

  const result = await prisma.destination.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      categoria: data.categoria,
      descripcionCorta: data.descripcionCorta,
      descripcionLarga: data.descripcionLarga,
      historia: data.historia,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      horario: data.horario as any,
      duracionVisita: data.duracionVisita,
      comoLlegar: data.comoLlegar,
      tags: data.tags,
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      rating: data.rating,
      destacado: data.destacado,
      activo: data.activo ?? true,
    },
    create: {
      id,
      slug,
      nombre: data.nombre || 'Nuevo Destino',
      categoria: data.categoria || 'cultural',
      descripcionCorta: data.descripcionCorta || '',
      descripcionLarga: data.descripcionLarga,
      historia: data.historia,
      coordenadas: (data.coordenadas as any) || { lat: -35.281739, lng: -71.258714 },
      direccion: data.direccion,
      horario: data.horario as any,
      duracionVisita: data.duracionVisita,
      comoLlegar: data.comoLlegar,
      tags: data.tags || [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria || [],
      rating: data.rating,
      destacado: data.destacado || false,
      activo: data.activo ?? true,
      ...({ orden: data.orden ?? (await nextOrden('destination')) } as any),
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  revalidatePath('/destino/[slug]', 'page');
  return result;
}

export async function deleteDestination(tokenOrId: string, maybeId?: string) {
  const token = maybeId ? tokenOrId : undefined;
  const id = maybeId ? maybeId : tokenOrId;

  await requireRole(['ADMIN'], token);
  await prisma.destination.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────

export async function saveRestaurant(
  tokenOrData: string | Partial<Restaurant>,
  maybeData?: Partial<Restaurant>
) {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const data = typeof tokenOrData === 'string' ? maybeData || {} : tokenOrData;

  await assertAuthorized(token);
  const id =
    data.id ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-rest';

  const result = await prisma.restaurant.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      tipo: data.tipo,
      descripcion: data.descripcion,
      especialidad: data.especialidad,
      propietario: data.propietario,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      telefono: data.telefono,
      whatsapp: data.whatsapp,
      horario: data.horario as any,
      mediosPago: data.mediosPago ?? [],
      tags: data.tags ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      menuUrl: data.menuUrl,
      contacto: data.contacto as any,
      activo: data.activo ?? true,
    },
    create: {
      id,
      nombre: data.nombre || 'Nuevo Restaurante',
      tipo: data.tipo,
      descripcion: data.descripcion || '',
      especialidad: data.especialidad,
      propietario: data.propietario,
      coordenadas: (data.coordenadas as any) || { lat: -35.281739, lng: -71.258714 },
      direccion: data.direccion,
      telefono: data.telefono,
      whatsapp: data.whatsapp,
      horario: data.horario as any,
      mediosPago: data.mediosPago ?? [],
      tags: data.tags ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      menuUrl: data.menuUrl,
      contacto: data.contacto as any,
      activo: data.activo ?? true,
      ...({ orden: data.orden ?? (await nextOrden('restaurant')) } as any),
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteRestaurant(tokenOrId: string, maybeId?: string) {
  const token = maybeId ? tokenOrId : undefined;
  const id = maybeId ? maybeId : tokenOrId;

  await requireRole(['ADMIN'], token);
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── ACCOMMODATIONS ───────────────────────────────────────────────────────────

export async function saveAccommodation(
  tokenOrData: string | Partial<Accommodation>,
  maybeData?: Partial<Accommodation>
) {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const data = typeof tokenOrData === 'string' ? maybeData || {} : tokenOrData;

  await assertAuthorized(token);
  const id =
    data.id ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-acc';

  const result = await prisma.accommodation.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      tipo: data.tipo,
      propietario: data.propietario,
      descripcion: data.descripcion,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      telefono: data.telefono,
      whatsapp: data.whatsapp,
      servicios: data.servicios ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      contacto: data.contacto as any,
      activo: data.activo ?? true,
    },
    create: {
      id,
      nombre: data.nombre || 'Nuevo Alojamiento',
      tipo: data.tipo,
      propietario: data.propietario,
      descripcion: data.descripcion || '',
      coordenadas: (data.coordenadas as any) || { lat: -35.281739, lng: -71.258714 },
      direccion: data.direccion,
      telefono: data.telefono,
      whatsapp: data.whatsapp,
      servicios: data.servicios ?? [],
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      contacto: data.contacto as any,
      activo: data.activo ?? true,
      ...({ orden: data.orden ?? (await nextOrden('accommodation')) } as any),
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteAccommodation(tokenOrId: string, maybeId?: string) {
  const token = maybeId ? tokenOrId : undefined;
  const id = maybeId ? maybeId : tokenOrId;

  await requireRole(['ADMIN'], token);
  await prisma.accommodation.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── BACKUP & RESTORE ─────────────────────────────────────────────────────────

export async function exportDatabaseBackup(token?: string) {
  await requireRole(['ADMIN'], token);
  const [
    destinations,
    restaurants,
    accommodations,
    events,
    config,
    tourRoutes,
    emergencyContacts,
  ] = await Promise.all([
    prisma.destination.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.restaurant.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.accommodation.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.event.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.config.findFirst(),
    prisma.tourRoute.findMany({ orderBy: { orden: 'asc' } }),
    prisma.emergencyContact.findMany({ orderBy: { orden: 'asc' } }),
  ]);

  return {
    version: '1.2',
    exportDate: new Date().toISOString(),
    site: 'Turismo Cumpeo',
    data: {
      destinations,
      restaurants,
      accommodations,
      events,
      config,
      tourRoutes,
      emergencyContacts,
    },
  };
}

export async function restoreDatabaseBackup(tokenOrData: string | any, maybeData?: any) {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const backupData = typeof tokenOrData === 'string' ? maybeData : tokenOrData;

  await requireRole(['ADMIN'], token);

  if (!backupData?.data) {
    throw new Error('Formato de copia de seguridad inválido');
  }

  const { destinations, restaurants, accommodations, events, tourRoutes, emergencyContacts } =
    backupData.data;

  // Restore Destinations
  if (Array.isArray(destinations)) {
    for (const d of destinations) {
      await prisma.destination.upsert({
        where: { id: d.id },
        update: { ...d },
        create: { ...d },
      });
    }
  }

  // Restore Restaurants
  if (Array.isArray(restaurants)) {
    for (const r of restaurants) {
      await prisma.restaurant.upsert({
        where: { id: r.id },
        update: { ...r },
        create: { ...r },
      });
    }
  }

  // Restore Accommodations
  if (Array.isArray(accommodations)) {
    for (const a of accommodations) {
      await prisma.accommodation.upsert({
        where: { id: a.id },
        update: { ...a },
        create: { ...a },
      });
    }
  }

  // Restore Events
  if (Array.isArray(events)) {
    for (const ev of events) {
      await prisma.event.upsert({
        where: { id: ev.id },
        update: { ...ev },
        create: { ...ev },
      });
    }
  }

  // Restore Tour Routes
  if (Array.isArray(tourRoutes)) {
    for (const tr of tourRoutes) {
      await prisma.tourRoute.upsert({
        where: { id: tr.id },
        update: { ...tr },
        create: { ...tr },
      });
    }
  }

  // Restore Emergency Contacts
  if (Array.isArray(emergencyContacts)) {
    for (const ec of emergencyContacts) {
      await prisma.emergencyContact.upsert({
        where: { id: ec.id },
        update: { ...ec },
        create: { ...ec },
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  revalidatePath('/ruta');
  return { success: true };
}

export async function bulkImportEntitiesAction(
  entityType: 'destinos' | 'restaurantes' | 'alojamientos' | 'eventos',
  items: any[],
  mode: 'upsert' | 'create_only' = 'upsert',
  token?: string
) {
  await requireRole(['ADMIN', 'EDITOR'], token);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (entityType === 'destinos') {
      const existingById = item.id ? await prisma.destination.findUnique({ where: { id: item.id } }) : null;
      const existingBySlug = item.slug ? await prisma.destination.findUnique({ where: { slug: item.slug } }) : null;
      const existing = existingById || existingBySlug;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.destination.update({
          where: { id: existing.id },
          data: {
            nombre: item.nombre,
            categoria: item.categoria,
            descripcionCorta: item.descripcionCorta,
            descripcionLarga: item.descripcionLarga || item.descripcionCorta,
            historia: item.historia || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            horario: item.horario || null,
            precio: item.precio || null,
            duracionVisita: item.duracionVisita || null,
            comoLlegar: item.comoLlegar || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.destination.create({
          data: {
            id: item.id,
            slug: item.slug || item.id,
            nombre: item.nombre,
            categoria: item.categoria,
            descripcionCorta: item.descripcionCorta,
            descripcionLarga: item.descripcionLarga || item.descripcionCorta,
            historia: item.historia || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            horario: item.horario || null,
            precio: item.precio || null,
            duracionVisita: item.duracionVisita || null,
            comoLlegar: item.comoLlegar || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    } else if (entityType === 'restaurantes') {
      const existing = item.id ? await prisma.restaurant.findUnique({ where: { id: item.id } }) : null;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.restaurant.update({
          where: { id: item.id },
          data: {
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            especialidad: item.especialidad || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            mediosPago: item.mediosPago || [],
            tags: item.tags || [],
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.restaurant.create({
          data: {
            id: item.id,
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            especialidad: item.especialidad || null,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            mediosPago: item.mediosPago || [],
            tags: item.tags || [],
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    } else if (entityType === 'alojamientos') {
      const existing = item.id ? await prisma.accommodation.findUnique({ where: { id: item.id } }) : null;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.accommodation.update({
          where: { id: item.id },
          data: {
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            servicios: item.servicios || [],
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.accommodation.create({
          data: {
            id: item.id,
            nombre: item.nombre,
            tipo: item.tipo || null,
            propietario: item.propietario || null,
            descripcion: item.descripcion,
            coordenadas: item.coordenadas,
            direccion: item.direccion || null,
            telefono: item.telefono || null,
            whatsapp: item.whatsapp || null,
            servicios: item.servicios || [],
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    } else if (entityType === 'eventos') {
      const existing = item.id ? await prisma.event.findUnique({ where: { id: item.id } }) : null;

      if (existing) {
        if (mode === 'create_only') {
          skippedCount++;
          continue;
        }
        await prisma.event.update({
          where: { id: item.id },
          data: {
            nombre: item.nombre,
            tipo: item.tipo,
            descripcion: item.descripcion,
            fecha: item.fecha || null,
            recurrente: Boolean(item.recurrente),
            coordenadas: item.coordenadas || null,
            direccion: item.direccion || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            ...(item.imagenPrincipal ? { imagenPrincipal: item.imagenPrincipal } : {}),
          },
        });
        updatedCount++;
      } else {
        await prisma.event.create({
          data: {
            id: item.id,
            nombre: item.nombre,
            tipo: item.tipo,
            descripcion: item.descripcion,
            fecha: item.fecha || null,
            recurrente: Boolean(item.recurrente),
            coordenadas: item.coordenadas || null,
            direccion: item.direccion || null,
            tags: item.tags || [],
            destacado: Boolean(item.destacado),
            activo: item.activo !== false,
            imagenPrincipal: item.imagenPrincipal || null,
          },
        });
        createdCount++;
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  revalidatePath('/ruta');

  return {
    success: true,
    createdCount,
    updatedCount,
    skippedCount,
    totalProcessed: items.length,
  };
}

// ─── ORDEN DE LOS CATASTROS EN LA PORTADA ─────────────────────────────────────

/**
 * Guarda el orden manual con que se muestran los catastros en la portada.
 *
 * Recibe los ids en el orden deseado y escribe la posicion (0, 1, 2...) en el
 * campo `orden` de cada registro. Las consultas publicas ordenan por
 * [orden asc, nombre asc], asi que un registro nuevo (orden 0) aparece arriba
 * y los empates siguen resolviendose alfabeticamente como antes.
 *
 * Se hace en una transaccion: o queda todo el orden nuevo, o no queda nada.
 * Un orden a medio aplicar seria peor que el anterior.
 */
export async function updateEntityOrder(
  tipo: OrderableEntity,
  orderedIds: string[]
): Promise<{ actualizados: number }> {
  await requireRole(['ADMIN', 'EDITOR']);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { actualizados: 0 };
  }

  // Ids repetidos dejarian dos registros con la misma posicion.
  const ids = Array.from(new Set(orderedIds.filter((id) => typeof id === 'string' && id)));

  const updates = ids.map((id, index) => {
    const data = { orden: index };
    switch (tipo) {
      case 'destinos':
        return prisma.destination.update({ where: { id }, data });
      case 'restaurantes':
        return prisma.restaurant.update({ where: { id }, data });
      case 'alojamientos':
        return prisma.accommodation.update({ where: { id }, data });
      case 'eventos':
        return prisma.event.update({ where: { id }, data });
      default:
        throw new Error(`Catastro desconocido: ${tipo}`);
    }
  });

  await prisma.$transaction(updates);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return { actualizados: ids.length };
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export async function getEvents() {
  return prisma.event.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] });
}

export async function saveEvent(
  tokenOrData: string | Partial<CumpeoEvent>,
  maybeData?: Partial<CumpeoEvent>
) {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const data = typeof tokenOrData === 'string' ? maybeData || {} : tokenOrData;

  await assertAuthorized(token);
  const id =
    data.id ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'new-event';

  const result = await prisma.event.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      tipo: data.tipo,
      descripcion: data.descripcion,
      descripcionLarga: data.descripcionLarga,
      fecha: data.fecha,
      recurrente: data.recurrente ?? true,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      tags: data.tags ?? [],
      destacado: data.destacado ?? false,
      activo: data.activo ?? true,
    },
    create: {
      id,
      nombre: data.nombre || 'Nuevo Evento',
      tipo: data.tipo || 'ferias-libres',
      descripcion: data.descripcion || '',
      descripcionLarga: data.descripcionLarga,
      fecha: data.fecha,
      recurrente: data.recurrente ?? true,
      coordenadas: data.coordenadas as any,
      direccion: data.direccion,
      imagenPrincipal: data.imagenPrincipal,
      galeria: data.galeria ?? [],
      tags: data.tags ?? [],
      destacado: data.destacado ?? false,
      activo: data.activo ?? true,
      ...({ orden: data.orden ?? (await nextOrden('event')) } as any),
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return result;
}

export async function deleteEvent(tokenOrId: string, maybeId?: string) {
  const token = maybeId ? tokenOrId : undefined;
  const id = maybeId ? maybeId : tokenOrId;

  await requireRole(['ADMIN'], token);
  await prisma.event.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/mapa');
  return true;
}

// ─── TOUR ROUTES (CIRCUITOS Y PARADAS CONFIGURABLES) ─────────────────────────

export async function getAdminTourRoutes(): Promise<TourRoute[]> {
  try {
    const data = await prisma.tourRoute.findMany({
      orderBy: { orden: 'asc' },
    });
    return data as unknown as TourRoute[];
  } catch (error) {
    console.error('Error fetching admin tour routes:', error);
    return [];
  }
}

export async function saveTourRoute(
  tokenOrData: string | Partial<TourRoute>,
  maybeData?: Partial<TourRoute>
) {
  const token = typeof tokenOrData === 'string' ? tokenOrData : undefined;
  const data = typeof tokenOrData === 'string' ? maybeData || {} : tokenOrData;

  await assertAuthorized(token);
  const slug =
    data.slug ||
    data.nombre?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
    'nueva-ruta';
  const id = data.id || slug;

  const result = await prisma.tourRoute.upsert({
    where: { id },
    update: {
      nombre: data.nombre,
      slug,
      descripcion: data.descripcion,
      color: data.color || '#E63946',
      poiIds: data.poiIds || [],
      duracionEstimada: data.duracionEstimada,
      distanciaKm: data.distanciaKm ? Number(data.distanciaKm) : null,
      dificultad: data.dificultad || 'Fácil',
      hitos: (data.hitos as any) ?? undefined,
      consejos: (data.consejos as any) ?? undefined,
      mapaImagen: data.mapaImagen,
      destacada: data.destacada ?? false,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    },
    create: {
      id,
      slug,
      nombre: data.nombre || 'Nueva Ruta',
      descripcion: data.descripcion || '',
      color: data.color || '#E63946',
      poiIds: data.poiIds || [],
      duracionEstimada: data.duracionEstimada,
      distanciaKm: data.distanciaKm ? Number(data.distanciaKm) : null,
      dificultad: data.dificultad || 'Fácil',
      hitos: (data.hitos as any) ?? [],
      consejos: (data.consejos as any) ?? [],
      mapaImagen: data.mapaImagen,
      destacada: data.destacada ?? false,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    },
  });

  revalidatePath('/');
  revalidatePath('/ruta');
  revalidatePath('/mapa');
  revalidatePath('/admin');
  return result;
}

export async function deleteTourRoute(tokenOrId: string, maybeId?: string) {
  const token = maybeId ? tokenOrId : undefined;
  const id = maybeId ? maybeId : tokenOrId;

  await requireRole(['ADMIN'], token);
  await prisma.tourRoute.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/ruta');
  revalidatePath('/mapa');
  revalidatePath('/admin');
  return true;
}

export async function updateTourRouteStops(
  tokenOrRouteId: string,
  routeIdOrPoiIds: string | string[],
  maybePoiIds?: string[]
) {
  let token: string | undefined;
  let routeId: string;
  let poiIds: string[];

  if (Array.isArray(routeIdOrPoiIds)) {
    token = undefined;
    routeId = tokenOrRouteId;
    poiIds = routeIdOrPoiIds;
  } else {
    token = tokenOrRouteId;
    routeId = routeIdOrPoiIds;
    poiIds = maybePoiIds || [];
  }

  await assertAuthorized(token);
  const result = await prisma.tourRoute.update({
    where: { id: routeId },
    data: { poiIds },
  });
  revalidatePath('/');
  revalidatePath('/ruta');
  revalidatePath('/mapa');
  revalidatePath('/admin');
}

// ─── USER MANAGEMENT (SOLO ADMINISTRADOR) ───────────────────────────────────

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

  revalidatePath('/admin');
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

  revalidatePath('/admin');
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
  revalidatePath('/admin');
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

  if (session.id === 'master-admin') {
    return {
      success: false,
      error: 'La clave de rescate del servidor se gestiona directamente en el archivo .env',
    };
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

