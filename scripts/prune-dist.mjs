// The ONNX runtime is served from /ort (copied by copy-ort.mjs). Vite also emits its own
// copy of the 21 MB wasm into dist/assets, which is never requested — remove it.
import { readdirSync, rmSync } from 'node:fs';
for (const f of readdirSync('dist/assets')) if (/^ort-wasm.*\.wasm$/.test(f)) rmSync(`dist/assets/${f}`);
