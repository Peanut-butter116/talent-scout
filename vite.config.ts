
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Absolute site URL for Open Graph tags (social previews need absolute image URLs).
// Set SITE_URL yourself, or let Vercel provide its production / preview domain.
const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  ''
).replace(/\/$/, '');

const ORT_VERSION = JSON.parse(readFileSync('node_modules/onnxruntime-web/package.json', 'utf8')).version;

export default defineConfig({
  plugins: [
    react(),
    { name: 'site-url', transformIndexHtml: { order: 'pre', handler: (html: string) => html.split('%SITE_URL%').join(SITE_URL) } },
  ],
  define: { __ORT_VERSION__: JSON.stringify(ORT_VERSION) },
  // transformers.js is loaded lazily on the Sourcing page; don't pre-bundle it.
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
