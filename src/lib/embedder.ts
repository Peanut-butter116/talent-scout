import type { Embed } from './extract';

/**
 * Loads the on-device sentence-embedding model (quantized all-MiniLM-L6-v2) on first use.
 * - transformers.js is dynamically imported, so it never slows down the main pages.
 * - Model files come from /models/ and the ONNX runtime from /ort/ on this site.
 *   Remote model downloads are switched off: no requests to Hugging Face or any CDN.
 * - Profile text is processed in the browser and never sent anywhere.
 */
export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let loading: Promise<Embed> | null = null;

export function loadEmbedder(): Promise<Embed> {
  if (!loading) {
    loading = (async () => {
      const t = await import('@huggingface/transformers');
      t.env.allowRemoteModels = false;
      t.env.allowLocalModels = true;
      t.env.localModelPath = '/models/';
      const wasm = t.env.backends.onnx.wasm;
      if (wasm) {
        wasm.wasmPaths = '/ort/';
        wasm.numThreads = 1;
      }
      const extractor = await t.pipeline('feature-extraction', MODEL_ID, { dtype: 'q8', device: 'wasm' });
      return async (texts: string[]) => {
        const out = await extractor(texts, { pooling: 'mean', normalize: true });
        return out.tolist() as number[][];
      };
    })();
    // If it fails, let a later attempt try again (the caller falls back to keywords meanwhile).
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}
