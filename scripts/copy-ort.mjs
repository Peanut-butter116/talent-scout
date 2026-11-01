// Copies the ONNX Runtime WebAssembly files into /public/ort so the browser loads them
// from our own site — never from a third-party CDN. Runs before dev and build.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const src = 'node_modules/onnxruntime-web/dist';
// Versioned folder so a long "immutable" cache can never serve an old runtime after an upgrade.
const version = JSON.parse(readFileSync('node_modules/onnxruntime-web/package.json', 'utf8')).version;
const root = 'public/ort';
const dest = `${root}/${version}`;
if (!existsSync(src)) {
  console.warn('[copy-ort] onnxruntime-web not installed; skipping');
  process.exit(0);
}
rmSync(root, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => /^ort-wasm-simd-threaded\.jsep\.(wasm|mjs)$/.test(f));
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log(`[copy-ort] copied ${files.length} files to ${dest}`);
