import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Configuración de ESLint del proyecto: el preset de Next (React, hooks y
 * accesibilidad) con tres reglas ajustadas al código de este repositorio.
 */
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'prisma/seed-data/**',
      'scripts/**',
      'public/**',
      'next-env.d.ts',
    ],
  },
  {
    // prisma/seed.js es un script de Node que se ejecuta con `node`, no un
    // módulo del bundle: require() ahí es lo correcto.
    files: ['prisma/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      // `any` aparece en los cruces con los campos Json de Prisma: queda como
      // aviso, sin frenar el build, mientras esos campos no estén tipados.
      '@typescript-eslint/no-explicit-any': 'warn',
      // El prefijo _ marca los parámetros que existen solo para cumplir una firma.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Las fotos del CMS se sirven por una ruta propia (/uploads), donde el
      // optimizador de next/image no aporta.
      '@next/next/no-img-element': 'off',
    },
  },
];

export default eslintConfig;
