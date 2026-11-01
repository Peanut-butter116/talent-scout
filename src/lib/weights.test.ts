import { describe, expect, it } from 'vitest';
import { SEED_ROLES } from '../data/roles';
import { addCriterion, apportion, removeCriterion, setWeight, totalWeight } from './weights';

describe('weights', () => {
  it('seed roles all sum to 100', () => {
    for (const r of SEED_ROLES) expect(totalWeight(r.criteria)).toBe(100);
  });

  it('apportion returns integers summing to the total', () => {
    const out = apportion([1, 1, 1], 100);
    expect(out.reduce((a, b) => a + b, 0)).toBe(100);
    expect(out.every(Number.isInteger)).toBe(true);
  });

  it('setWeight keeps total at 100 and scales others proportionally', () => {
    const crit = SEED_ROLES[0].criteria;
    for (const w of [0, 1, 33, 50, 99, 100]) {
      const next = setWeight(crit, 'ai_rt', w);
      expect(totalWeight(next)).toBe(100);
      expect(next.find((c) => c.id === 'ai_rt')!.weight).toBe(w);
    }
    const next = setWeight(crit, 'ai_rt', 45);
    // ai_model (25) and ai_pedigree (10) keep a ~2.5 : 1 ratio
    const m = next.find((c) => c.id === 'ai_model')!.weight;
    const p = next.find((c) => c.id === 'ai_pedigree')!.weight;
    expect(m / p).toBeGreaterThan(2);
    expect(m / p).toBeLessThan(3.1);
  });

  it('setWeight recovers when every other weight is zero', () => {
    const crit = [
      { id: 'a', name: 'a', weight: 100 },
      { id: 'b', name: 'b', weight: 0 },
      { id: 'c', name: 'c', weight: 0 },
    ];
    const next = setWeight(crit, 'a', 40);
    expect(totalWeight(next)).toBe(100);
    expect(next[1].weight).toBe(30);
  });

  it('add and remove keep total at 100', () => {
    const crit = SEED_ROLES[1].criteria;
    const added = addCriterion(crit, { id: 'x', name: 'New' });
    expect(totalWeight(added)).toBe(100);
    expect(added.find((c) => c.id === 'x')!.weight).toBe(10);
    const removed = removeCriterion(added, 'fs_backend');
    expect(totalWeight(removed)).toBe(100);
    expect(removed.some((c) => c.id === 'fs_backend')).toBe(false);
  });
});
