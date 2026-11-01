import { describe, expect, it } from 'vitest';
import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_ROLES } from '../data/roles';
import type { Candidate, Role } from '../types';
import { cautiousFit, checkMustHaves, confidenceLabel, confidenceScoreFor, NEUTRAL_FIT, rankCandidates, scoreCandidate } from './scoring';
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
  it('is coverage × quality × verification on a 0–100 scale', () => {
    expect(confidenceScoreFor(1, 1, 1)).toBe(100);
    expect(confidenceScoreFor(0.5, 1, 1)).toBe(50);
    expect(confidenceScoreFor(1, 0.6, 0.85)).toBe(51);
    expect(confidenceScoreFor(0, 1, 1)).toBe(0);
  });

  it('labels: High ≥ 65, Medium ≥ 40, Low below', () => {
    expect(confidenceLabel(65)).toBe('High');
    expect(confidenceLabel(64.9)).toBe('Medium');
    expect(confidenceLabel(40)).toBe('Medium');
    expect(confidenceLabel(39.9)).toBe('Low');
  });

  it('strong evidence and coffee-chat checks raise confidence; weak evidence lowers it', () => {
    const strong = cand('s', { a: { rating: 4, strength: 'strong', note: '' }, b: { rating: 4, strength: 'strong', note: '' }, c: { rating: 4, strength: 'strong', note: '' } });
    const weak = cand('w', { a: { rating: 4, strength: 'weak', note: '' }, b: { rating: 4, strength: 'weak', note: '' }, c: { rating: 4, strength: 'weak', note: '' } });
    const chat = cand('c', { a: { rating: 4, strength: 'strong', note: '', checkedInChat: true }, b: { rating: 4, strength: 'strong', note: '', checkedInChat: true }, c: { rating: 4, strength: 'strong', note: '', checkedInChat: true } });
    const s = scoreCandidate(strong, role);
    expect(s.quality).toBe(1);
    expect(s.verification).toBeCloseTo(0.85);
    expect(s.confidenceScore).toBe(85);
    expect(scoreCandidate(weak, role).confidenceScore).toBe(51);
    expect(scoreCandidate(chat, role).confidenceScore).toBe(100);
    // Confidence never changes fit.
    expect(scoreCandidate(weak, role).fit).toBeCloseTo(s.fit!);
  });

  it('missing evidence lowers confidence via coverage', () => {
    const thin = cand('t', { a: { rating: 4, strength: 'strong', note: '' } });
    expect(scoreCandidate(thin, role).confidenceScore).toBe(42.5);
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

describe('cautious fit', () => {
  const ai = SEED_ROLES.find((r) => r.id === 'ai-eng')!;

  it('equals raw fit at full coverage and shrinks thin profiles towards a neutral 50', () => {
    expect(NEUTRAL_FIT).toBe(50);
    expect(cautiousFit({ fit: 90, coverage: 100 })).toBeCloseTo(90);
    expect(cautiousFit({ fit: 90, coverage: 25 })).toBeCloseTo(0.25 * 90 + 0.75 * 50);
    expect(cautiousFit({ fit: 20, coverage: 25 })).toBeCloseTo(0.25 * 20 + 0.75 * 50);
    expect(cautiousFit({ fit: null, coverage: 0 })).toBe(50);
  });

  it('does not depend on the other candidates', () => {
    const alone = rankCandidates(SEED_CANDIDATES.filter((c) => c.id === 'c-alexis'), ai)[0];
    const all = rankCandidates(SEED_CANDIDATES, ai).find((r) => r.candidate.id === 'c-alexis')!;
    expect(alone.cautiousFit).toBeCloseTo(all.cautiousFit);
  });

  it('thin profiles (Alexis Brandt, Yuki Brannigan) rank high on raw fit but not by default', () => {
    const cautious = rankCandidates(SEED_CANDIDATES, ai).map((r) => r.candidate.id);
    const raw = rankCandidates(SEED_CANDIDATES, ai, 'raw').map((r) => r.candidate.id);
    for (const id of ['c-alexis', 'c-yuki']) {
      expect(cautious.indexOf(id)).toBeGreaterThanOrEqual(3);
      expect(raw.indexOf(id)).toBeLessThan(cautious.indexOf(id));
    }
  });

  it('every role has at least 5 new candidates for a shortlist', () => {
    for (const r of SEED_ROLES) {
      const fresh = rankCandidates(SEED_CANDIDATES, r).filter((x) => x.candidate.status === 'new' && !x.mustHaves.flagged);
      expect(fresh.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('tags candidates under 40% coverage as needing more evidence', () => {
    const ranked = rankCandidates(SEED_CANDIDATES, ai);
    expect(ranked.find((r) => r.candidate.id === 'c-alexis')!.needsMoreEvidence).toBe(true);
    expect(ranked.find((r) => r.candidate.id === 'c-sam')!.needsMoreEvidence).toBe(false);
  });

  it('never changes raw fit', () => {
    for (const r of rankCandidates(SEED_CANDIDATES, ai)) {
      expect(r.score.fit).toBe(scoreCandidate(r.candidate, ai).fit);
    }
  });
});
