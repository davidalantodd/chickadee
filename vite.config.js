import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Unit tests (npm test). Components run in a simulated browser (jsdom); the Netlify function tests opt into
  // Node with a `@vitest-environment node` comment at the top of the file.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'netlify/**/*.test.js'],
    unstubGlobals: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}', 'netlify/**/*.js'],
      exclude: [
        '**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx', // only mounts <App/>
        'netlify/lib/*-data.js', // generated data
      ],
      reporter: ['text', 'html'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
})
