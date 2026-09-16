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
import { sesionConRol } from './authActions';
import { Resultado, exito, fallo } from '@/lib/resultado';

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
export async function getThemeConfigAdmin(): Promise<Resultado<ThemeConfigRecord | null>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR', 'LECTOR']);
  if (!sesion.ok) return sesion;

  try {
    const row = await prisma.themeConfig.findUnique({ where: { id: 'default' } });
    return exito(row ? toRecord(row) : null);
  } catch (error) {
    console.warn('Error fetching theme config (admin):', error);
    return exito(null);
  }
}

/** Hex normalizado, o el mensaje de error si el valor no sirve. */
function normalizeHex(
  value: string | null | undefined,
  label: string
): { hex: string | null; error?: undefined } | { hex?: undefined; error: string } {
  if (value === null || value === undefined || value === '') return { hex: null };
  const v = value.trim();
  if (!isValidHex(v)) {
    return { error: `${label}: "${v}" no es un color hexadecimal válido (ej. #E63946)` };
  }
  return { hex: v };
}

/** Guarda la apariencia completa. Un campo en null vuelve a su valor por defecto. */
export async function saveTheme(input: ThemeSaveInput): Promise<Resultado<ThemeConfigRecord>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  const revisados = {
    colorPrimario: normalizeHex(input?.colorPrimario, 'Color dominante'),
    colorAcento: normalizeHex(input?.colorAcento, 'Color de acento'),
    colorFondo: normalizeHex(input?.colorFondo, 'Fondo / papel'),
    colorTexto: normalizeHex(input?.colorTexto, 'Texto / tinta'),
  };

  const detalles: Record<string, string> = {};
  for (const [campo, revisado] of Object.entries(revisados)) {
    if (revisado.error) detalles[campo] = revisado.error;
  }
  if (Object.keys(detalles).length > 0) {
    return fallo('VALIDACION', 'Revisa los colores marcados.', detalles);
  }

  const colorPrimario = revisados.colorPrimario.hex ?? null;
  const colorAcento = revisados.colorAcento.hex ?? null;
  const colorFondo = revisados.colorFondo.hex ?? null;
  const colorTexto = revisados.colorTexto.hex ?? null;

  const fontBody = input.fontBody && isKnownFontKey(BODY_FONTS, input.fontBody) ? input.fontBody : null;
  const fontDisplay = input.fontDisplay && isKnownFontKey(DISPLAY_FONTS, input.fontDisplay) ? input.fontDisplay : null;

  const data = {
    colorPrimario,
    colorAcento,
    colorFondo,
    colorTexto,
    fontBody,
    fontDisplay,
    updatedByEmail: sesion.data.email,
    updatedByNombre: sesion.data.nombre,
  };

  const saved = await prisma.themeConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  });

  revalidateSite();
  return exito(toRecord(saved));
}

/** Descarta todos los cambios y vuelve a la apariencia original del código. */
export async function resetTheme(): Promise<Resultado<true>> {
  const sesion = await sesionConRol(['ADMIN', 'EDITOR']);
  if (!sesion.ok) return sesion;

  await prisma.themeConfig.deleteMany({ where: { id: 'default' } });
  revalidateSite();
  return exito(true);
}
