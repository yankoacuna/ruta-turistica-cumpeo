import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rojo: {
          DEFAULT: '#E63946',
          light: '#FF4D5A',
          dark: '#C1121F',
        },
        sol: {
          DEFAULT: '#FFC300',
          light: '#FFD166',
          dark: '#E0A900',
        },
        cielo: {
          DEFAULT: '#0077B6',
          light: '#0096C7',
          dark: '#023E8A',
        },
        verde: {
          DEFAULT: '#2A9D8F',
          light: '#38B000',
          dark: '#1A759F',
        },
        tierra: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
        },
        bg: '#F4F3EF',
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FAF8F5',
          hover: '#F0EDE6',
        },
        text: {
          primary: '#1E1E24',
          secondary: '#4A4E69',
          muted: '#8D99AE',
        },
        border: {
          DEFAULT: '#E2E0D8',
          hover: '#E63946',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        rojo: '0 4px 15px rgba(230,57,70,0.3)',
      },
      backgroundImage: {
        'grad-hero': 'linear-gradient(180deg, rgba(230,57,70,0.08) 0%, rgba(244,243,239,0.9) 70%, #F4F3EF 100%)',
        'grad-rojo': 'linear-gradient(135deg, #E63946, #C1121F)',
        'grad-sol': 'linear-gradient(135deg, #FFD166, #FFC300)',
        'grad-cielo': 'linear-gradient(135deg, #0096C7, #0077B6)',
      },
    },
  },
  plugins: [],
}
export default config
