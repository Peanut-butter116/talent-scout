// Dev-only: runs the real on-device model (local files) on the example profiles, to tune thresholds.
// Usage: npx tsx scripts/tune.mts
import { env, pipeline } from '@huggingface/transformers';
import { EXAMPLE_PROFILES } from '../src/data/examples';
import { SEED_ROLES } from '../src/data/roles';
import { extractWithModel } from '../src/lib/extract';

env.allowRemoteModels = false;
env.localModelPath = 'public/models/';
const ex = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' });
const embed = async (t: string[]) => (await ex(t, { pooling: 'mean', normalize: true })).tolist() as number[][];
for (const p of EXAMPLE_PROFILES) {
  const role = SEED_ROLES.find((r) => r.id === p.roleId)!;
  console.log('\n== ' + p.label);
  for (const s of await extractWithModel(p.text, role, embed)) {
    console.log(`  ${s.criterionId.padEnd(14)} ${s.similarity.toFixed(2)} ${String(s.strength).padEnd(6)} r=${s.rating} | ${s.sentence?.slice(0, 64)}`);
  }
}
