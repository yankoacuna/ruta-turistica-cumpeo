'use server';

/**
 * Server actions de la apariencia editable del sitio (paleta y tipografías).
 *
 * Autorización: guardar y restaurar exige rol ADMIN o EDITOR, igual que el
 * resto del contenido del CMS.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { THEME_TAG } from '@/lib/data';
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  isKnownFontKey,
} from '@/lib/theme';
import { isValidHex } from '@/lib/color';
import type { ThemeConfigRecord, ThemeSaveInput } from '@/lib/types';
import { requireRole } from './actions';

function revalidateSite() {
  revalidateTag(THEME_TAG);
  // El tema se resuelve en el layout raíz: revalidarlo alcanza a todo el sitio
  // (incluido el propio panel de administración) de una sola vez.
  revalidatePath('/', 'layout');
}

function toRecord(row: {
  colorPrimario: string | null;
  colorAcento: string | null;
  colorFondo: string | null;
  colorTexto: string | null;
  fontBody: string | null;
  fontDisplay: string | null;
  updatedAt: Date;
  updatedByEmail: string | null;
  updatedByNombre: string | null;
}): ThemeConfigRecord {
  return {
    colorPrimario: row.colorPrimario,
    colorAcento: row.colorAcento,
    colorFondo: row.colorFondo,
    colorTexto: row.colorTexto,
    fontBody: row.fontBody,
    fontDisplay: row.fontDisplay,
    updatedAt: row.updatedAt.toISOString(),
    updatedByEmail: row.updatedByEmail,
    updatedByNombre: row.updatedByNombre,
  };
}

/** Apariencia guardada, para precargar el formulario del CMS. */
export async function getThemeConfigAdmin(): Promise<ThemeConfigRecord | null> {
  await requireRole(['ADMIN', 'EDITOR', 'LECTOR']);
  try {
    const row = await prisma.themeConfig.findUnique({ where: { id: 'default' } });
    return row ? toRecord(row) : null;
  } catch (error) {
    console.warn('Error fetching theme config (admin):', error);
    return null;
  }
}

function normalizeHex(value: string | null | undefined, label: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  const v = value.trim();
  if (!isValidHex(v)) {
    throw new Error(`${label}: "${v}" no es un color hexadecimal válido (ej. #E63946)`);
  }
  return v;
}

/** Guarda la apariencia completa. Un campo en null vuelve a su valor por defecto. */
export async function saveTheme(input: ThemeSaveInput): Promise<ThemeConfigRecord> {
  const session = await requireRole(['ADMIN', 'EDITOR']);

  const colorPrimario = normalizeHex(input.colorPrimario, 'Color dominante');
  const colorAcento = normalizeHex(input.colorAcento, 'Color de acento');
  const colorFondo = normalizeHex(input.colorFondo, 'Fondo / papel');
  const colorTexto = normalizeHex(input.colorTexto, 'Texto / tinta');

  const fontBody = input.fontBody && isKnownFontKey(BODY_FONTS, input.fontBody) ? input.fontBody : null;
  const fontDisplay = input.fontDisplay && isKnownFontKey(DISPLAY_FONTS, input.fontDisplay) ? input.fontDisplay : null;

  const data = {
    colorPrimario,
    colorAcento,
    colorFondo,
    colorTexto,
    fontBody,
    fontDisplay,
    updatedByEmail: session.email,
    updatedByNombre: session.nombre,
  };

  const saved = await prisma.themeConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  });

  revalidateSite();
  return toRecord(saved);
}

/** Descarta todos los cambios y vuelve a la apariencia original del código. */
export async function resetTheme(): Promise<void> {
  await requireRole(['ADMIN', 'EDITOR']);
  await prisma.themeConfig.deleteMany({ where: { id: 'default' } });
  revalidateSite();
}
