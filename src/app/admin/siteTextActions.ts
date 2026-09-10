'use server';

/**
 * Server actions de los textos editables del sitio público.
 *
 * Autorización: guardar y restaurar exige rol ADMIN o EDITOR, igual que el
 * resto del contenido. El "modo edición" del sitio público es solo interfaz:
 * la única barrera real es esta capa, que revalida la sesión en cada llamada.
 *
 * Auditoría: cada cambio deja un registro en SiteTextRevision con el valor
 * anterior, el nuevo, el autor y la fecha, y el texto vigente guarda quién lo
 * editó por última vez.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SITE_TEXTS_TAG } from '@/lib/data';
import {
  SITE_TEXT_DEFAULTS,
  SITE_TEXT_MAX_LENGTH,
  isKnownSiteTextKey,
} from '@/lib/siteTexts';
import type {
  SiteTextRecord,
  SiteTextRevisionRecord,
  SiteTextSaveResult,
  EditModeAccess,
} from '@/lib/types';
import { getAdminSession, requireRole } from './actions';

/**
 * Normaliza lo que escribió el editor. Se guarda texto plano: el sitio lo
 * renderiza con React (que escapa el contenido), así que no hay riesgo de
 * inyección de HTML. Lo que sí se hace es unificar los saltos de línea, acotar
 * el largo y descartar caracteres de control, que no aportan nada a un texto
 * de portada y sí pueden ensuciar el renderizado.
 */
function normalizeValue(raw: string): string {
  const texto = String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .slice(0, SITE_TEXT_MAX_LENGTH)
    .trim();

  return Array.from(texto)
    .filter((ch) => ch === '\n' || ch === '\t' || ch >= ' ')
    .join('');
}

function revalidateSite() {
  revalidateTag(SITE_TEXTS_TAG);
  // El proveedor de textos vive en el layout raíz: revalidar el layout alcanza
  // a todas las páginas públicas de una sola vez.
  revalidatePath('/', 'layout');
}

function toRecord(row: {
  key: string;
  value: string;
  updatedAt: Date;
  updatedByEmail: string | null;
  updatedByNombre: string | null;
}): SiteTextRecord {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt.toISOString(),
    updatedByEmail: row.updatedByEmail,
    updatedByNombre: row.updatedByNombre,
  };
}

/**
 * ¿Puede la persona que está viendo el sitio activar el modo edición?
 * No lanza error: si no hay sesión simplemente responde que no, para que un
 * visitante anónimo nunca vea nada distinto.
 */
export async function getEditModeAccess(): Promise<EditModeAccess> {
  try {
    const session = await getAdminSession();
    if (!session) return { canEdit: false, user: null };
    const canEdit = session.role === 'ADMIN' || session.role === 'EDITOR';
    return {
      canEdit,
      user: { nombre: session.nombre, email: session.email, role: session.role },
    };
  } catch {
    return { canEdit: false, user: null };
  }
}

/** Guarda un texto. Si el valor queda vacío, vuelve al texto original del código. */
export async function saveSiteText(
  key: string,
  value: string
): Promise<SiteTextSaveResult> {
  const session = await requireRole(['ADMIN', 'EDITOR']);

  if (!isKnownSiteTextKey(key)) {
    throw new Error(`El texto "${key}" no existe en el registro del sitio`);
  }

  const nuevo = normalizeValue(value);
  const anterior = await prisma.siteText.findUnique({ where: { key } });
  const valorAnterior = anterior?.value ?? SITE_TEXT_DEFAULTS[key] ?? null;

  // Vaciar el campo equivale a restaurar el texto original.
  if (nuevo.length === 0) {
    return resetSiteTextInternal(key, session, valorAnterior);
  }

  if (valorAnterior === nuevo && anterior) {
    return { key, valorVigente: anterior.value, esOriginal: false, record: toRecord(anterior) };
  }

  const [saved] = await prisma.$transaction([
    prisma.siteText.upsert({
      where: { key },
      create: {
        key,
        value: nuevo,
        updatedById: session.id,
        updatedByEmail: session.email,
        updatedByNombre: session.nombre,
      },
      update: {
        value: nuevo,
        updatedById: session.id,
        updatedByEmail: session.email,
        updatedByNombre: session.nombre,
      },
    }),
    prisma.siteTextRevision.create({
      data: {
        key,
        valorAnterior,
        valorNuevo: nuevo,
        accion: 'editar',
        autorId: session.id,
        autorEmail: session.email,
        autorNombre: session.nombre,
      },
    }),
  ]);

  revalidateSite();
  return { key, valorVigente: saved.value, esOriginal: false, record: toRecord(saved) };
}

/** Guarda varios textos de una vez: es lo que usa el formulario del CMS. */
export async function saveSiteTexts(
  entries: Array<{ key: string; value: string }>
): Promise<SiteTextSaveResult[]> {
  await requireRole(['ADMIN', 'EDITOR']);

  const out: SiteTextSaveResult[] = [];
  for (const entry of entries) {
    out.push(await saveSiteText(entry.key, entry.value));
  }
  return out;
}

async function resetSiteTextInternal(
  key: string,
  session: { id: string; email: string; nombre: string },
  valorAnterior: string | null
): Promise<SiteTextSaveResult> {
  const original = SITE_TEXT_DEFAULTS[key] ?? '';

  await prisma.$transaction([
    prisma.siteText.deleteMany({ where: { key } }),
    prisma.siteTextRevision.create({
      data: {
        key,
        valorAnterior,
        valorNuevo: original,
        accion: 'original',
        autorId: session.id,
        autorEmail: session.email,
        autorNombre: session.nombre,
      },
    }),
  ]);

  revalidateSite();
  return { key, valorVigente: original, esOriginal: true, record: null };
}

/** Descarta el cambio y vuelve al texto original que trae el código. */
export async function resetSiteText(key: string): Promise<SiteTextSaveResult> {
  const session = await requireRole(['ADMIN', 'EDITOR']);
  if (!isKnownSiteTextKey(key)) {
    throw new Error(`El texto "${key}" no existe en el registro del sitio`);
  }
  const anterior = await prisma.siteText.findUnique({ where: { key } });
  return resetSiteTextInternal(key, session, anterior?.value ?? null);
}

/** Textos modificados, con su auditoría, para el listado del CMS. */
export async function getSiteTextsAdmin(): Promise<SiteTextRecord[]> {
  await requireRole(['ADMIN', 'EDITOR', 'LECTOR']);
  try {
    const rows = await prisma.siteText.findMany({ orderBy: { updatedAt: 'desc' } });
    return rows.filter((r) => isKnownSiteTextKey(r.key)).map(toRecord);
  } catch (error) {
    console.warn('Error fetching site texts (admin):', error);
    return [];
  }
}

/** Historial de cambios de un texto, del más reciente al más antiguo. */
export async function getSiteTextRevisions(
  key: string,
  limit = 20
): Promise<SiteTextRevisionRecord[]> {
  await requireRole(['ADMIN', 'EDITOR', 'LECTOR']);
  try {
    const rows = await prisma.siteTextRevision.findMany({
      where: { key },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      valorAnterior: r.valorAnterior,
      valorNuevo: r.valorNuevo,
      accion: r.accion,
      autorEmail: r.autorEmail,
      autorNombre: r.autorNombre,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn('Error fetching site text revisions:', error);
    return [];
  }
}

/** Vuelve a dejar vigente el valor de una versión anterior. */
export async function restoreSiteTextRevision(
  revisionId: string
): Promise<SiteTextSaveResult> {
  const session = await requireRole(['ADMIN', 'EDITOR']);

  const revision = await prisma.siteTextRevision.findUnique({ where: { id: revisionId } });
  if (!revision) throw new Error('La versión que intentas restaurar ya no existe');
  if (!isKnownSiteTextKey(revision.key)) {
    throw new Error(`El texto "${revision.key}" no existe en el registro del sitio`);
  }

  const actual = await prisma.siteText.findUnique({ where: { key: revision.key } });
  const valorAnterior = actual?.value ?? SITE_TEXT_DEFAULTS[revision.key] ?? null;
  const destino = normalizeValue(revision.valorNuevo);

  // Restaurar al valor original del código significa borrar el override.
  if (destino === (SITE_TEXT_DEFAULTS[revision.key] ?? '')) {
    return resetSiteTextInternal(revision.key, session, valorAnterior);
  }

  const [saved] = await prisma.$transaction([
    prisma.siteText.upsert({
      where: { key: revision.key },
      create: {
        key: revision.key,
        value: destino,
        updatedById: session.id,
        updatedByEmail: session.email,
        updatedByNombre: session.nombre,
      },
      update: {
        value: destino,
        updatedById: session.id,
        updatedByEmail: session.email,
        updatedByNombre: session.nombre,
      },
    }),
    prisma.siteTextRevision.create({
      data: {
        key: revision.key,
        valorAnterior,
        valorNuevo: destino,
        accion: 'restaurar',
        autorId: session.id,
        autorEmail: session.email,
        autorNombre: session.nombre,
      },
    }),
  ]);

  revalidateSite();
  return {
    key: revision.key,
    valorVigente: saved.value,
    esOriginal: false,
    record: toRecord(saved),
  };
}
