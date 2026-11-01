import { describe, expect, it } from 'vitest';
import { createSeedState, reducer } from '../state/reducer';
import {
  decodeResultsHash,
  decodeReviewHash,
  encodeResultsHash,
  encodeReviewHash,
  isResultsHash,
  planImport,
  summarise,
} from './share';

const link = { roleId: 'ai-eng', week: '2026-11-02', candidateIds: ['c-sam', 'c-jordan', 'c-morgan'] };

describe('review links', () => {
  it('round-trips', () => {
    const hash = encodeReviewHash(link);
    expect(hash.startsWith('#')).toBe(true);
    const back = decodeReviewHash(hash);
    expect(back).toEqual({ ok: true, value: link });
  });

  it('contains only ids — no names or evidence', () => {
    const hash = decodeURIComponent(encodeReviewHash(link));
    expect(hash).not.toMatch(/Okafor|Sam |Ferreira|ASR|latency/);
    expect(hash).toMatch(/^#v=1&r=ai-eng&w=2026-11-02&c=c-sam,c-jordan,c-morgan$/);
  });

  it('drops non-seeded (added) candidates when encoding', () => {
    const hash = encodeReviewHash({ ...link, candidateIds: ['c-sam', 'user-abc123'] });
    expect(decodeReviewHash(hash)).toMatchObject({ ok: true, value: { candidateIds: ['c-sam'] } });
  });

  it.each([
    ['', 'empty'],
    ['#v=2&r=ai-eng&w=2026-11-02&c=c-sam', 'wrong version'],
    ['#v=1&r=hacker&w=2026-11-02&c=c-sam', 'unknown role'],
    ['#v=1&r=ai-eng&w=tomorrow&c=c-sam', 'bad week'],
    ['#v=1&r=ai-eng&w=2026-11-02&c=', 'no candidates'],
    ['#v=1&r=ai-eng&w=2026-11-02&c=c-nobody,<script>', 'unknown ids only'],
    ['#' + 'x'.repeat(3000), 'too long'],
  ])('rejects bad links safely (%s → %s)', (hash) => {
    const r = decodeReviewHash(hash);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(5);
  });

  it('filters edited links: unknown, duplicate and excess ids are dropped', () => {
    const many = ['c-sam', 'c-sam', 'c-evil', 'c-jordan', ...Array(20).fill('c-kai')].join(',');
    const r = decodeReviewHash(`#v=1&r=all&w=2026-11-02&c=${many}`);
    expect(r).toMatchObject({ ok: true, value: { roleId: 'all', candidateIds: ['c-sam', 'c-jordan', 'c-kai'] } });
  });
});

describe('results links', () => {
  const results = {
    ...link,
    decisions: {
      'c-sam': { decision: 'priority' as const },
      'c-jordan': { decision: 'approve' as const },
      'c-morgan': { decision: 'skip' as const, reason: 'missing_skill' as const },
    },
  };

  it('round-trips with skip reasons', () => {
    const hash = encodeResultsHash(results);
    expect(isResultsHash(hash)).toBe(true);
    expect(decodeURIComponent(hash)).toContain('d=c-sam:p,c-jordan:a,c-morgan:sm');
    expect(decodeResultsHash(hash)).toEqual({ ok: true, value: results });
    expect(summarise(results.decisions)).toEqual({ approved: 1, priority: 1, skipped: 1 });
  });

  it('ignores malformed decisions but keeps valid ones', () => {
    const r = decodeResultsHash('#v=1&r=ai-eng&w=2026-11-02&ceo=1&d=c-sam:a,c-jordan:x,c-morgan:az,c-evil:a,c-kai:sq');
    expect(r).toMatchObject({ ok: true, value: { candidateIds: ['c-sam'] } });
  });

  it('rejects links with no valid decisions or not marked as results', () => {
    expect(decodeResultsHash('#v=1&r=ai-eng&w=2026-11-02&ceo=1&d=c-evil:a').ok).toBe(false);
    expect(decodeResultsHash(encodeReviewHash(link)).ok).toBe(false);
  });
});

describe('importing decisions', () => {
  it('applies only to candidates still waiting, and records them as review decisions', () => {
    let s = createSeedState();
    s = reducer(s, { type: 'SET_STATUS', candidateIds: ['c-jordan', 'c-morgan'], status: 'suggested' });
    const results = {
      roleId: 'ai-eng',
      week: '2026-11-02',
      candidateIds: ['c-jordan', 'c-morgan', 'c-sam'],
      decisions: {
        'c-jordan': { decision: 'priority' as const },
        'c-morgan': { decision: 'skip' as const, reason: 'wrong_seniority' as const },
        'c-sam': { decision: 'approve' as const }, // already "Chat done" — must be left alone
      },
    };
    expect(planImport(s.candidates, results)).toEqual({ apply: ['c-jordan', 'c-morgan'], ignored: ['c-sam'] });
    const next = reducer(s, { type: 'IMPORT_DECISIONS', results });
    const get = (id: string) => next.candidates.find((c) => c.id === id)!;
    expect(get('c-jordan')).toMatchObject({ status: 'approved', priority: true });
    expect(get('c-morgan')).toMatchObject({ status: 'skipped', skipReason: 'wrong_seniority' });
    expect(get('c-sam').status).toBe('done');
    expect(next.reviewLog).toHaveLength(2);
  });
});
