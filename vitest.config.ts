import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Todas las rutas se anclan al directorio de este archivo y no al de
 * invocación: el Node.js Selector de cPanel no siempre ejecuta los scripts
 * desde la raíz del proyecto, y con rutas relativas vitest carga los tests
 * contra un `root` equivocado y no ejecuta ninguno.
 */
const raiz = __dirname;

export default defineConfig({
  root: raiz,
  resolve: {
    alias: {
      '@': path.resolve(raiz, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: [path.resolve(raiz, 'vitest.setup.ts')],
  },
});
