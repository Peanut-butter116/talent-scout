import { describe, expect, it } from 'vitest';
import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_CHATS } from '../data/chats';
import { SEED_ROLES } from '../data/roles';
import type { ChatFeedback } from '../types';
import { analyzeRole, labelFor, overstatedCriteria, suggestRubricChange } from './analysis';

const role = (id: string) => SEED_ROLES.find((r) => r.id === id)!;
const analyze = (id: string, chats: ChatFeedback[] = SEED_CHATS) =>
  analyzeRole(role(id), SEED_ROLES, SEED_CANDIDATES, chats);
const labelOf = (id: string, critId: string, chats?: ChatFeedback[]) =>
  analyze(id, chats).find((a) => a.criterion.id === critId)!.label;

describe('labelFor', () => {
  it('needs at least 2 chats', () => {
    expect(labelFor(0, 0, 0, null)).toBe('Not tested yet');
    expect(labelFor(1, 1, 0, null)).toBe('Not tested yet');
  });
  it('is Unclear with a missing or tiny group', () => {
    expect(labelFor(2, 2, 0, null)).toBe('Unclear');
    expect(labelFor(4, 3, 1, 0.9)).toBe('Unclear');
  });
  it('labels clear differences', () => {
    expect(labelFor(4, 2, 2, 0.5)).toBe('Holding up');
    expect(labelFor(4, 2, 2, 0)).toBe('Not supported');
    expect(labelFor(4, 2, 2, -0.4)).toBe('Not supported');
    expect(labelFor(4, 2, 2, 0.1)).toBe('Unclear');
  });
});

describe('hypothesis labels on seeded data', () => {
  it('Builder is holding up (pooled across roles)', () => {
    for (const [r, c] of [
      ['ai-eng', 'ai_builder'],
      ['fullstack', 'fs_builder'],
      ['head-eng', 'he_builder'],
      ['bizops', 'bo_builder'],
      ['talent', 'tp_builder'],
    ]) {
      expect(labelOf(r, c)).toBe('Holding up');
    }
    const a = analyze('ai-eng').find((x) => x.criterion.id === 'ai_builder')!;
    expect(a.pooled).toBe(true);
    expect(a.n).toBe(10);
    expect(a.highAvg!).toBeGreaterThan(a.lowAvg!);
  });

  it('pedigree-style criteria are not supported', () => {
    expect(labelOf('ai-eng', 'ai_pedigree')).toBe('Not supported');
    expect(labelOf('fullstack', 'fs_pedigree')).toBe('Not supported');
    const a = analyze('ai-eng').find((x) => x.criterion.id === 'ai_pedigree')!;
    expect(a.highAvg!).toBeLessThanOrEqual(a.lowAvg!);
  });

  it('shows the other labels too', () => {
    expect(labelOf('ai-eng', 'ai_sharp')).toBe('Unclear');
    expect(labelOf('ai-eng', 'ai_judgement')).toBe('Not tested yet');
  });

  it('with no chats everything is Not tested yet', () => {
    for (const a of analyze('ai-eng', [])) expect(a.label).toBe('Not tested yet');
  });

  it('flags Sharp & curious as overstated by profiles', () => {
    const over = overstatedCriteria(analyze('ai-eng')).map((a) => a.criterion.id);
    expect(over).toContain('ai_sharp');
    expect(over).not.toContain('ai_builder');
  });
});

describe('suggestRubricChange', () => {
  it('suggests lowering High-bar background 10 → 5 and raising Builder 10 → 15', () => {
    const s = suggestRubricChange(role('ai-eng'), analyze('ai-eng'))!;
    expect(s).not.toBeNull();
    expect(s.lower).toMatchObject({ criterionId: 'ai_pedigree', from: 10, to: 5 });
    expect(s.raise).toMatchObject({ criterionId: 'ai_builder', from: 10, to: 15 });
    expect(s.reason.length).toBeGreaterThan(10);
  });

  it('suggests a matching change for Full Stack', () => {
    const s = suggestRubricChange(role('fullstack'), analyze('fullstack'))!;
    expect(s.lower).toMatchObject({ criterionId: 'fs_pedigree', from: 10, to: 5 });
    expect(s.raise).toMatchObject({ criterionId: 'fs_builder', from: 25, to: 30 });
  });

  it('suggests nothing once the weight is already at the floor', () => {
    const r = role('ai-eng');
    const lowered = {
      ...r,
      criteria: r.criteria.map((c) =>
        c.id === 'ai_pedigree' ? { ...c, weight: 5 } : c.id === 'ai_builder' ? { ...c, weight: 15 } : c,
      ),
    };
    expect(suggestRubricChange(lowered, analyzeRole(lowered, SEED_ROLES, SEED_CANDIDATES, SEED_CHATS))).toBeNull();
  });

  it('suggests nothing with no chats', () => {
    expect(suggestRubricChange(role('ai-eng'), analyze('ai-eng', []))).toBeNull();
  });
});
