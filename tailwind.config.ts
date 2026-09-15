import type { Config } from 'tailwindcss'

/**
 * Sistema visual "Papel de Historieta" — Turismo Cumpeo.
 *
 * Regla de color: 1 dominante (rojo Condorito) + 1 acento (sol) + neutros
 * calidos (tinta / papel). Los hues secundarios (cielo, verde, tierra) quedan
 * SOLO para semantica de datos: marcadores de mapa y color de categoria. Nunca
 * como decoracion de UI, porque es lo que aplanaba la jerarquia.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Dominante, acento, papel y tinta apuntan a variables CSS (ver
        // globals.css) en vez de hex fijos: es lo que le permite al CMS
        // (src/lib/theme.ts) reteñir todo el sitio en tiempo real sin tocar
        // ninguna clase de Tailwind. Los valores por defecto de esas
        // variables son los mismos hex que había acá antes. ──
        // Formato rgb(var(--x) / <alpha-value>): es lo que le permite a
        // Tailwind generar clases con opacidad (ej. "bg-paper-warm/95")
        // para un color que en realidad vive en una variable CSS editable
        // desde el CMS (ver globals.css y src/lib/theme.ts). Un simple
        // var(--x) con hex fijo no admite el modificador de opacidad.
        rojo: {
          DEFAULT: 'rgb(var(--color-rojo) / <alpha-value>)',
          light: 'rgb(var(--color-rojo-light) / <alpha-value>)',
          dark: 'rgb(var(--color-rojo-dark) / <alpha-value>)',
        },
        sol: {
          DEFAULT: 'rgb(var(--color-sol) / <alpha-value>)',
          light: 'rgb(var(--color-sol-light) / <alpha-value>)',
          dark: 'rgb(var(--color-sol-dark) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          line: 'rgb(var(--color-ink-line) / <alpha-value>)',
        },
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          warm: 'rgb(var(--color-paper-warm) / <alpha-value>)',
          deep: 'rgb(var(--color-paper-deep) / <alpha-value>)',
        },

        // ── Semanticos de datos (mapa / categorias). No usar como decoracion.
        // Fijos a propósito: no son parte de la paleta de marca editable. ──
        cielo: { DEFAULT: '#0077B6', light: '#0096C7', dark: '#023E8A' },
        verde: { DEFAULT: '#2A9D8F', light: '#38B000', dark: '#1A759F' },
        tierra: { DEFAULT: '#D97706', light: '#F59E0B', dark: '#B45309' },

        // ── Roles (mismos nombres que antes: no rompe el resto del sitio) ──
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          soft: 'rgb(var(--color-surface-soft) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
          hover: 'rgb(var(--color-border-hover) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Apuntan a variables CSS por el mismo motivo que los colores: el CMS
        // puede cambiar la tipografía del sitio sobreescribiendo --font-body
        // y --font-display, sin recompilar Tailwind.
        sans: ['var(--font-body)', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Fredoka', 'Outfit', 'sans-serif'],
      },
      fontSize: {
        // Escala real. 0.75rem (12px) es el piso duro: nada de 10-11px.
        'display-xl': ['clamp(2.5rem, 9vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(1.75rem, 5vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-md': ['clamp(1.375rem, 3.5vw, 1.875rem)', { lineHeight: '1.12', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        // Sombra dura de viñeta, no blur difuso.
        comic: '3px 3px 0 #231F20',
        'comic-sm': '2px 2px 0 #231F20',
        'comic-sol': '3px 3px 0 #E0A900',
        rojo: '0 4px 15px rgba(230,57,70,0.3)',
      },
      backgroundImage: {
        'grad-hero': 'linear-gradient(180deg, rgba(230,57,70,0.08) 0%, rgba(247,243,232,0.9) 70%, #F7F3E8 100%)',
        'grad-rojo': 'linear-gradient(135deg, #E63946, #C1121F)',
        'grad-sol': 'linear-gradient(135deg, #FFD54A, #FFC300)',
        'grad-cielo': 'linear-gradient(135deg, #0096C7, #0077B6)',
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
}
export default config
