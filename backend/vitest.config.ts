import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    // forks: cada test file corre en su propio proceso Node.js con un module
    // cache unificado — esto garantiza que require() compartido entre test y
    // servicio devuelva la misma instancia, haciendo que vi.spyOn funcione
    pool: 'forks',
  },
});
