import { describe, expect, it } from 'vitest';
import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_ROLES } from '../data/roles';
import type { Candidate, Role } from '../types';
import { checkMustHaves, confidenceFor, rankCandidates, scoreCandidate } from './scoring';
import { setWeight } from './weights';

const role: Role = {
  id: 'r',
  title: 'Test role',
  summary: '',
  criteria: [
    { id: 'a', name: 'A', weight: 50 },
    { id: 'b', name: 'B', weight: 30 },
    { id: 'c', name: 'C', weight: 20 },
  ],
  mustHaves: [{ id: 'rtw', label: 'Right to work in UK', enabled: true }],
};

const cand = (id: string, evidence: Candidate['evidence'], mustHaves: Candidate['mustHaves'] = {}): Candidate => ({
  id,
  name: id,
  headline: '',
  employer: 'Fictional Co',
  roleId: 'r',
  source: 'Inbound',
  status: 'new',
  evidence,
  mustHaves,
});

describe('scoreCandidate', () => {
  it('computes a weighted average over evidenced criteria', () => {
    const s = scoreCandidate(
      cand('x', {
        a: { rating: 5, strength: 'strong', note: '' },
        b: { rating: 0, strength: 'strong', note: '' },
        c: { rating: 5, strength: 'strong', note: '' },
      }),
      role,
    );
    expect(s.fit).toBeCloseTo(70);
    expect(s.coverage).toBe(100);
    expect(s.confidence).toBe('High');
  });

  it('re-normalises weights so missing evidence never lowers fit', () => {
    const full = cand('full', {
      a: { rating: 4, strength: 'strong', note: '' },
      b: { rating: 4, strength: 'strong', note: '' },
      c: { rating: 4, strength: 'strong', note: '' },
    });
    const thin = cand('thin', { a: { rating: 4, strength: 'strong', note: '' } });
    const sFull = scoreCandidate(full, role);
    const sThin = scoreCandidate(thin, role);
    expect(sThin.fit).toBeCloseTo(sFull.fit!);
    expect(sThin.coverage).toBe(50);
    expect(sThin.evidencedCount).toBe(1);
    expect(sThin.totalCount).toBe(3);
    expect(sThin.confidence).not.toBe('High');
  });

  it('removing any piece of evidence never lowers fit below the remaining average (seed data)', () => {
    for (const r of SEED_ROLES) {
      for (const c of SEED_CANDIDATES.filter((x) => x.roleId === r.id)) {
        const base = scoreCandidate(c, r);
        for (const critId of Object.keys(c.evidence)) {
          const removed = { ...c, evidence: { ...c.evidence, [critId]: undefined } };
          const s = scoreCandidate(removed, r);
          const rating = c.evidence[critId]!.rating;
          // Dropping a below-average rating raises fit; dropping an above-average one lowers it
          // only because that rating was genuinely good — never because "missing" counts as 0.
          if (s.fit !== null && rating * 20 <= base.fit!) expect(s.fit).toBeGreaterThanOrEqual(base.fit! - 1e-9);
          expect(s.coverage).toBeLessThanOrEqual(base.coverage);
        }
      }
    }
  });

  it('adding a new criterion with no evidence leaves fit unchanged', () => {
    const c = cand('x', { a: { rating: 3, strength: 'weak', note: '' } });
    const before = scoreCandidate(c, role).fit;
    const extended: Role = { ...role, criteria: [...role.criteria.map((x) => ({ ...x, weight: x.weight - 5 })), { id: 'new', name: 'New', weight: 15 }] };
    expect(scoreCandidate(c, extended).fit).toBeCloseTo(before!);
  });

  it('returns null fit when nothing is evidenced', () => {
    expect(scoreCandidate(cand('x', {}), role).fit).toBeNull();
  });
});

describe('confidence', () => {
  it('is High only with ≥80% coverage and mostly strong evidence', () => {
    expect(confidenceFor(80, 0.6)).toBe('High');
    expect(confidenceFor(79, 1)).toBe('Medium');
    expect(confidenceFor(100, 0.5)).toBe('Medium');
    expect(confidenceFor(40, 1)).toBe('Low');
  });
});

describe('must-haves', () => {
  it('Unknown never flags; only explicit No flags', () => {
    expect(checkMustHaves(cand('u', {}), role).flagged).toBe(false);
    expect(checkMustHaves(cand('u', {}, { rtw: 'unknown' }), role).flagged).toBe(false);
    expect(checkMustHaves(cand('u', {}, { rtw: 'unknown' }), role).unknownCount).toBe(1);
    expect(checkMustHaves(cand('y', {}, { rtw: 'yes' }), role).flagged).toBe(false);
    expect(checkMustHaves(cand('n', {}, { rtw: 'no' }), role).flagged).toBe(true);
  });

  it('disabled must-haves are ignored', () => {
    const r = { ...role, mustHaves: [{ ...role.mustHaves[0], enabled: false }] };
    expect(checkMustHaves(cand('n', {}, { rtw: 'no' }), r).flagged).toBe(false);
  });
});

describe('rankCandidates', () => {
  const x = cand('x', {
    a: { rating: 5, strength: 'strong', note: '' },
    b: { rating: 1, strength: 'strong', note: '' },
  });
  const y = cand('y', {
    a: { rating: 2, strength: 'strong', note: '' },
    b: { rating: 5, strength: 'strong', note: '' },
  });

  it('ranks by fit', () => {
    const ranked = rankCandidates([x, y], role);
    expect(ranked.map((r) => r.candidate.id)).toEqual(['x', 'y']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2]);
  });

  it('re-ranks when weights change', () => {
    const shifted = { ...role, criteria: setWeight(role.criteria, 'b', 70) };
    expect(rankCandidates([x, y], shifted).map((r) => r.candidate.id)).toEqual(['y', 'x']);
  });

  it('re-ranks seeded Founding AI Engineer candidates when real-time weight rises', () => {
    const ai = SEED_ROLES.find((r) => r.id === 'ai-eng')!;
    const before = rankCandidates(SEED_CANDIDATES, ai).map((r) => r.candidate.id);
    const after = rankCandidates(SEED_CANDIDATES, { ...ai, criteria: setWeight(ai.criteria, 'ai_rt', 60) }).map((r) => r.candidate.id);
    expect(after).not.toEqual(before);
    expect(after.indexOf('c-sam')).toBeLessThan(before.indexOf('c-sam') + 1);
    expect(after.indexOf('c-jordan')).toBeLessThan(before.indexOf('c-jordan'));
  });
});
