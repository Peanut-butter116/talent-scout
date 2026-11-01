// Downloads the quantized Xenova/all-MiniLM-L6-v2 model into /public/models and checks it
// against the SHA-256 Hugging Face publishes. Only needed if the files are missing.
// Needs network access to huggingface.co and its file CDN (*.hf.co).
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const REPO = 'Xenova/all-MiniLM-L6-v2';
const OUT = join('public/models', REPO);
const FILES = {
  'config.json': null,
  'tokenizer.json': null,
  'tokenizer_config.json': null,
  'special_tokens_map.json': null,
  'onnx/model_quantized.onnx': 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1',
};

for (const [file, sha] of Object.entries(FILES)) {
  const res = await fetch(`https://huggingface.co/${REPO}/resolve/main/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha && createHash('sha256').update(buf).digest('hex') !== sha) throw new Error(`${file}: hash mismatch`);
  mkdirSync(dirname(join(OUT, file)), { recursive: true });
  writeFileSync(join(OUT, file), buf);
  console.log(`saved ${file} (${buf.length} bytes)`);
}
