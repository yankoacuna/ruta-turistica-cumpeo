/**
 * Apariencia editable del sitio: paleta de colores y tipografías.
 *
 * Mismo espíritu que src/lib/siteTexts.ts: los valores por defecto viven acá,
 * tal como estaban antes de existir esta funcionalidad (ver tailwind.config.ts
 * y globals.css). La tabla ThemeConfig solo guarda lo que un editor cambió; si
 * está vacía, el sitio se ve exactamente igual que siempre.
 *
 * Diseño deliberadamente simple: el editor elige 4 colores base (dominante,
 * acento, fondo y texto) y 2 tipografías (texto y titulares). El resto de la
 * paleta —tonos claros/oscuros, superficies, bordes— se deriva en automático
 * (ver src/lib/color.ts) para que cuatro decisiones basten para reteñir todo
 * el sistema sin que el editor tenga que ajustar quince variables a mano.
 *
 * Los colores semánticos de datos (cielo/verde/tierra, usados por el mapa y
 * las categorías) quedan fuera a propósito: no son decoración de marca.
 */

import { adjustLightness, hexToRgbTriplet, isValidHex } from './color';

export interface FontOption {
  key: string;
  /** Nombre que ve el editor en el CMS. */
  label: string;
  /** Nombre de la familia tal como la conoce CSS/Google Fonts. */
  family: string;
  /** Parámetro para la URL de Google Fonts, ej. "Outfit:wght@400;600;800". */
  googleParam: string;
  fallback: string;
}

export const BODY_FONTS: FontOption[] = [
  { key: 'outfit', label: 'Outfit (por defecto)', family: 'Outfit', googleParam: 'Outfit:wght@400;500;600;700;800', fallback: 'system-ui, sans-serif' },
  { key: 'inter', label: 'Inter', family: 'Inter', googleParam: 'Inter:wght@400;500;600;700;800', fallback: 'system-ui, sans-serif' },
  { key: 'poppins', label: 'Poppins', family: 'Poppins', googleParam: 'Poppins:wght@400;500;600;700;800', fallback: 'system-ui, sans-serif' },
  { key: 'nunito', label: 'Nunito Sans', family: 'Nunito Sans', googleParam: 'Nunito+Sans:wght@400;500;600;700;800', fallback: 'system-ui, sans-serif' },
  { key: 'worksans', label: 'Work Sans', family: 'Work Sans', googleParam: 'Work+Sans:wght@400;500;600;700;800', fallback: 'system-ui, sans-serif' },
];

export const DISPLAY_FONTS: FontOption[] = [
  { key: 'fredoka', label: 'Fredoka (por defecto)', family: 'Fredoka', googleParam: 'Fredoka:wght@500;600;700', fallback: 'sans-serif' },
  { key: 'poppins', label: 'Poppins', family: 'Poppins', googleParam: 'Poppins:wght@600;700;800', fallback: 'sans-serif' },
  { key: 'baloo2', label: 'Baloo 2', family: 'Baloo 2', googleParam: 'Baloo+2:wght@600;700;800', fallback: 'sans-serif' },
  { key: 'montserrat', label: 'Montserrat', family: 'Montserrat', googleParam: 'Montserrat:wght@600;700;800', fallback: 'sans-serif' },
  { key: 'playfair', label: 'Playfair Display', family: 'Playfair Display', googleParam: 'Playfair+Display:wght@600;700;800', fallback: 'serif' },
];

export const DEFAULT_FONT_BODY = 'outfit';
export const DEFAULT_FONT_DISPLAY = 'fredoka';

/** Valores por defecto: los mismos hex que ya estaban en tailwind.config.ts. */
export const THEME_COLOR_DEFAULTS = {
  primario: '#E63946',
  acento: '#FFC300',
  fondo: '#F7F3E8',
  texto: '#231F20',
};

export type ThemeColorKey = keyof typeof THEME_COLOR_DEFAULTS;

export const THEME_COLOR_DEFS: Array<{ key: ThemeColorKey; label: string; hint: string }> = [
  { key: 'primario', label: 'Color dominante', hint: 'Botones principales, marca, acentos fuertes.' },
  { key: 'acento', label: 'Color de acento', hint: 'Detalles destacados sobre el color dominante.' },
  { key: 'fondo', label: 'Fondo / papel', hint: 'Fondo general del sitio y las tarjetas.' },
  { key: 'texto', label: 'Texto / tinta', hint: 'Color base de los títulos y párrafos.' },
];

export function isKnownFontKey(catalog: FontOption[], key: string): boolean {
  return catalog.some((f) => f.key === key);
}

export function findFont(catalog: FontOption[], key: string | null | undefined, fallbackKey: string): FontOption {
  return catalog.find((f) => f.key === key) || catalog.find((f) => f.key === fallbackKey)!;
}

/** Lo que un editor pudo haber cambiado. Todo opcional: ausente = valor por defecto. */
export interface ThemeOverrides {
  colorPrimario?: string | null;
  colorAcento?: string | null;
  colorFondo?: string | null;
  colorTexto?: string | null;
  fontBody?: string | null;
  fontDisplay?: string | null;
}

export interface ResolvedTheme {
  /** true si nada fue personalizado: permite saltarse la inyección de estilos. */
  isDefault: boolean;
  /** Variables CSS ya calculadas, listas para volcar en un <style>. */
  cssVars: Record<string, string>;
  fontBody: FontOption;
  fontDisplay: FontOption;
}

/**
 * Resuelve la apariencia final: aplica los overrides guardados sobre los
 * valores por defecto y deriva toda la paleta dependiente. Un hex inválido
 * guardado en la base (no debería pasar, saveTheme() lo valida) se ignora en
 * vez de romper el render.
 */
export function resolveTheme(overrides: ThemeOverrides): ResolvedTheme {
  const primario = overrides.colorPrimario && isValidHex(overrides.colorPrimario)
    ? overrides.colorPrimario
    : THEME_COLOR_DEFAULTS.primario;
  const acento = overrides.colorAcento && isValidHex(overrides.colorAcento)
    ? overrides.colorAcento
    : THEME_COLOR_DEFAULTS.acento;
  const fondo = overrides.colorFondo && isValidHex(overrides.colorFondo)
    ? overrides.colorFondo
    : THEME_COLOR_DEFAULTS.fondo;
  const texto = overrides.colorTexto && isValidHex(overrides.colorTexto)
    ? overrides.colorTexto
    : THEME_COLOR_DEFAULTS.texto;

  const fontBody = findFont(BODY_FONTS, overrides.fontBody, DEFAULT_FONT_BODY);
  const fontDisplay = findFont(DISPLAY_FONTS, overrides.fontDisplay, DEFAULT_FONT_DISPLAY);

  const isDefault =
    primario === THEME_COLOR_DEFAULTS.primario &&
    acento === THEME_COLOR_DEFAULTS.acento &&
    fondo === THEME_COLOR_DEFAULTS.fondo &&
    texto === THEME_COLOR_DEFAULTS.texto &&
    fontBody.key === DEFAULT_FONT_BODY &&
    fontDisplay.key === DEFAULT_FONT_DISPLAY;

  // Formato "R G B" (no hex): es lo que permite que las clases de Tailwind
  // con opacidad (ej. "bg-paper-warm/95") generen una regla real. Ver
  // tailwind.config.ts, que consume estas variables como
  // rgb(var(--x) / <alpha-value>).
  const rgb = hexToRgbTriplet;

  const cssVars: Record<string, string> = {
    '--color-rojo': rgb(primario),
    '--color-rojo-light': rgb(adjustLightness(primario, 12)),
    '--color-rojo-dark': rgb(adjustLightness(primario, -16)),
    '--color-border-hover': rgb(primario),

    '--color-sol': rgb(acento),
    '--color-sol-light': rgb(adjustLightness(acento, 12)),
    '--color-sol-dark': rgb(adjustLightness(acento, -10)),

    '--color-bg': rgb(fondo),
    '--color-paper': rgb(fondo),
    '--color-paper-warm': rgb(adjustLightness(fondo, 3)),
    '--color-paper-deep': rgb(adjustLightness(fondo, -4)),
    '--color-surface': rgb(adjustLightness(fondo, 6)),
    '--color-surface-soft': rgb(adjustLightness(fondo, 3)),
    '--color-surface-hover': rgb(adjustLightness(fondo, -4)),
    '--color-border': rgb(adjustLightness(fondo, -8)),
    '--color-border-strong': rgb(adjustLightness(fondo, -14)),

    '--color-ink': rgb(texto),
    '--color-ink-soft': rgb(adjustLightness(texto, 10)),
    '--color-text-primary': rgb(texto),
    '--color-text-secondary': rgb(adjustLightness(texto, 20)),
    '--color-text-muted': rgb(adjustLightness(texto, 30)),

    '--font-body': `'${fontBody.family}', ${fontBody.fallback}`,
    '--font-display': `'${fontDisplay.family}', '${fontBody.family}', ${fontDisplay.fallback}`,
  };

  return { isDefault, cssVars, fontBody, fontDisplay };
}

/** CSS de :root con las variables resueltas, para inyectar en <head>. */
export function themeToStyleTag(resolved: ResolvedTheme): string {
  const body = Object.entries(resolved.cssVars)
    .map(([k, v]) => `${k}:${v};`)
    .join('');
  return `:root{${body}}`;
}

/** URL de Google Fonts para las dos tipografías resueltas. */
export function themeToGoogleFontsHref(resolved: ResolvedTheme): string {
  const params = Array.from(new Set([resolved.fontBody.googleParam, resolved.fontDisplay.googleParam]));
  const query = params.map((p) => `family=${p}`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
