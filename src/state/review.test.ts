import { describe, expect, it } from 'vitest';
import { biggestUncertainty, REVIEW_WEEKLY_CAP, reviewDeck, skipReasonCounts } from '../lib/pipeline';
import { createSeedState, reducer, type AppState } from './reducer';

const NOW = new Date('2026-11-04T12:00:00Z');
const AT = NOW.toISOString();

function withSuggested(): AppState {
  return reducer(createSeedState(), { type: 'GENERATE_SHORTLIST', roleId: null, at: AT });
}

describe('generate shortlist', () => {
  it('moves up to 5 new candidates to Suggested', () => {
    const s = withSuggested();
    const suggested = s.candidates.filter((c) => c.status === 'suggested');
    expect(suggested).toHaveLength(5);
    expect(suggested.every((c) => c.shortlistedAt === AT)).toBe(true);
  });

  it('is a no-op when nobody is left', () => {
    let s = createSeedState();
    for (let i = 0; i < 5; i++) s = reducer(s, { type: 'GENERATE_SHORTLIST', roleId: 'ai-eng', at: AT });
    const again = reducer(s, { type: 'GENERATE_SHORTLIST', roleId: 'ai-eng', at: AT });
    expect(again).toBe(s);
  });
});

describe('quick review decisions', () => {
  it('approve, priority and skip update status and log the decision', () => {
    let s = withSuggested();
    const [a, b, c] = reviewDeck(s.candidates, s.roles, null, s.reviewLog, NOW).map((r) => r.candidate.id);
    s = reducer(s, { type: 'REVIEW_DECISION', candidateId: a, decision: 'approve', at: AT });
    s = reducer(s, { type: 'REVIEW_DECISION', candidateId: b, decision: 'priority', at: AT });
    s = reducer(s, { type: 'REVIEW_DECISION', candidateId: c, decision: 'skip', reason: 'wrong_seniority', at: AT });
    const get = (id: string) => s.candidates.find((x) => x.id === id)!;
    expect(get(a).status).toBe('approved');
    expect(get(a).priority).toBeFalsy();
    expect(get(b)).toMatchObject({ status: 'approved', priority: true });
    expect(get(c)).toMatchObject({ status: 'skipped', skipReason: 'wrong_seniority' });
    expect(s.reviewLog.map((e) => e.decision)).toEqual(['approve', 'priority', 'skip']);
    expect(skipReasonCounts(s.candidates, null).wrong_seniority).toBe(1);
  });

  it('undo restores the previous state of the last decision only', () => {
    let s = withSuggested();
    const [a, b] = reviewDeck(s.candidates, s.roles, null, s.reviewLog, NOW).map((r) => r.candidate.id);
    s = reducer(s, { type: 'REVIEW_DECISION', candidateId: a, decision: 'approve', at: AT });
    s = reducer(s, { type: 'REVIEW_DECISION', candidateId: b, decision: 'skip', reason: 'other', at: AT });
    s = reducer(s, { type: 'UNDO_REVIEW' });
    const get = (id: string) => s.candidates.find((x) => x.id === id)!;
    expect(get(b).status).toBe('suggested');
    expect(get(b).skipReason).toBeUndefined();
    expect(get(a).status).toBe('approved');
    expect(s.reviewLog).toHaveLength(1);
  });

  it('deck is capped at 10 decisions per week', () => {
    let s = createSeedState();
    // Put every new candidate into Suggested.
    const ids = s.candidates.filter((c) => c.status === 'new').map((c) => c.id);
    s = reducer(s, { type: 'SET_STATUS', candidateIds: ids, status: 'suggested', at: AT });
    // Fake 8 decisions earlier this week.
    s = {
      ...s,
      reviewLog: Array.from({ length: 8 }, (_, i) => ({
        id: `r${i}`,
        candidateId: 'x',
        roleId: 'ai-eng',
        decision: 'approve' as const,
        at: AT,
        prev: { status: 'suggested' as const },
      })),
    };
    expect(reviewDeck(s.candidates, s.roles, null, s.reviewLog, NOW)).toHaveLength(REVIEW_WEEKLY_CAP - 8);
    // Last week's decisions don't count.
    const old = s.reviewLog.map((e) => ({ ...e, at: '2026-10-20T10:00:00Z' }));
    expect(reviewDeck(s.candidates, s.roles, null, old, NOW).length).toBe(Math.min(ids.length, REVIEW_WEEKLY_CAP));
  });

  it('moving a skipped candidate elsewhere clears the reason', () => {
    let s = createSeedState();
    s = reducer(s, { type: 'SET_STATUS', candidateIds: ['c-lee'], status: 'skipped', skipReason: 'other' });
    s = reducer(s, { type: 'SET_STATUS', candidateIds: ['c-lee'], status: 'suggested' });
    expect(s.candidates.find((c) => c.id === 'c-lee')!.skipReason).toBeUndefined();
  });

  it('replied flag counts toward reply rate', () => {
    let s = createSeedState();
    s = reducer(s, { type: 'SET_REPLIED', candidateId: 'c-ellis', replied: true });
    expect(s.candidates.find((c) => c.id === 'c-ellis')!.replied).toBe(true);
  });
});

describe('biggestUncertainty', () => {
  it('names the heaviest missing criterion first', () => {
    const s = createSeedState();
    const alexis = s.candidates.find((c) => c.id === 'c-alexis')!;
    expect(biggestUncertainty(alexis, s.roles[0])).toMatch(/Real-time/);
  });
});
