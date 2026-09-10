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
        // ── Dominante: rojo Condorito ──
        rojo: {
          DEFAULT: '#E63946',
          light: '#FF5A66',
          dark: '#C1121F',
        },
        // ── Acento: amarillo sol (solo destacados y sobre tinta) ──
        sol: {
          DEFAULT: '#FFC300',
          light: '#FFD54A',
          dark: '#E0A900',
        },
        // ── Tinta: negro calido de imprenta, reemplaza al negro azulado ──
        ink: {
          DEFAULT: '#231F20',
          soft: '#3D3733',
          line: '#C9BFA8',
        },
        // ── Papel: crema de diario, mas calido que el gris anterior ──
        paper: {
          DEFAULT: '#F7F3E8',
          warm: '#FDFBF4',
          deep: '#EFE8D6',
        },

        // ── Semanticos de datos (mapa / categorias). No usar como decoracion ──
        cielo: { DEFAULT: '#0077B6', light: '#0096C7', dark: '#023E8A' },
        verde: { DEFAULT: '#2A9D8F', light: '#38B000', dark: '#1A759F' },
        tierra: { DEFAULT: '#D97706', light: '#F59E0B', dark: '#B45309' },

        // ── Roles (mismos nombres que antes: no rompe el resto del sitio) ──
        bg: '#F7F3E8',
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FDFBF4',
          hover: '#EFE8D6',
        },
        text: {
          primary: '#231F20',   // 14.9:1 sobre papel
          secondary: '#574F45', //  7.3:1 sobre papel
          muted: '#6B6055',     //  5.6:1 sobre papel (antes 2.9:1 = fallaba AA)
        },
        border: {
          DEFAULT: '#E0D8C6',
          strong: '#C9BFA8',
          hover: '#E63946',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Outfit', 'sans-serif'],
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
