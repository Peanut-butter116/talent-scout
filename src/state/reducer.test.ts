import { describe, expect, it } from 'vitest';
import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_CHATS } from '../data/chats';
import { SEED_ROLES } from '../data/roles';
import { analyzeRole, suggestRubricChange } from '../lib/analysis';
import { totalWeight } from '../lib/weights';
import { applyChatChecks } from '../lib/scoring';
import { createSeedState, loadState, reducer, saveState, STORAGE_KEY, type AppState } from './reducer';

const memStorage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

function mutate(s: AppState): AppState {
  let x = reducer(s, { type: 'SET_WEIGHT', roleId: 'ai-eng', criterionId: 'ai_rt', weight: 50 });
  x = reducer(x, { type: 'ADD_CRITERION', roleId: 'ai-eng', name: 'Ships fast' });
  x = reducer(x, { type: 'SET_STATUS', candidateIds: ['c-jordan'], status: 'approved' });
  x = reducer(x, {
    type: 'LOG_CHAT',
    chat: { id: 'n', candidateId: 'c-nadia', roleId: 'fullstack', outcome: 'progress', observed: {}, note: '', at: new Date().toISOString() },
  });
  x = reducer(x, { type: 'SET_WELCOME_SEEN' });
  return x;
}

describe('reset', () => {
  it('restores the seed data', () => {
    const changed = mutate(createSeedState());
    expect(changed).not.toEqual(createSeedState());
    const reset = reducer(changed, { type: 'RESET' });
    const seed = createSeedState();
    expect(reset.roles).toEqual(seed.roles);
    expect(reset.candidates).toEqual(seed.candidates);
    expect(reset.chats).toEqual(seed.chats);
    expect(reset.weightHistory).toEqual([]);
    expect(reset.dismissedSuggestions).toEqual([]);
    // After an explicit reset we don't show the welcome modal again.
    expect(reset.welcomeSeen).toBe(true);
  });

  it('seed is not mutated by reducer actions', () => {
    mutate(createSeedState());
    expect(createSeedState().roles).toEqual(SEED_ROLES);
    expect(createSeedState().candidates).toEqual(applyChatChecks(SEED_CANDIDATES, SEED_CHATS));
    expect(createSeedState().chats).toEqual(SEED_CHATS);
  });
});

describe('persistence', () => {
  it('round-trips through storage under one versioned key', () => {
    const st = memStorage();
    const s = mutate(createSeedState());
    saveState(st, s);
    expect([...st.m.keys()]).toEqual([STORAGE_KEY]);
    expect(loadState(st)).toEqual(s);
  });

  it('falls back to seed when storage is empty, corrupt or old', () => {
    const st = memStorage();
    expect(loadState(st)).toEqual(createSeedState());
    st.setItem(STORAGE_KEY, '{not json');
    expect(loadState(st)).toEqual(createSeedState());
    st.setItem(STORAGE_KEY, JSON.stringify({ version: 0 }));
    expect(loadState(st)).toEqual(createSeedState());
  });
});

describe('weights in state', () => {
  it('slider moves merge into one history entry and total stays 100', () => {
    let s = createSeedState();
    const t0 = Date.parse('2026-11-01T10:00:00Z');
    for (const [i, w] of [30, 35, 40].entries()) {
      s = reducer(s, { type: 'SET_WEIGHT', roleId: 'ai-eng', criterionId: 'ai_rt', weight: w, at: new Date(t0 + i * 500).toISOString() });
    }
    expect(s.weightHistory).toHaveLength(1);
    expect(s.weightHistory[0]).toMatchObject({ from: 25, to: 40 });
    expect(totalWeight(s.roles[0].criteria)).toBe(100);
  });

  it('accepting a suggestion updates weights and logs it', () => {
    let s = createSeedState();
    const role = s.roles[0];
    const sug = suggestRubricChange(role, analyzeRole(role, s.roles, s.candidates, s.chats))!;
    s = reducer(s, { type: 'ACCEPT_SUGGESTION', suggestion: sug });
    const crit = s.roles[0].criteria;
    expect(crit.find((c) => c.id === 'ai_pedigree')!.weight).toBe(5);
    expect(crit.find((c) => c.id === 'ai_builder')!.weight).toBe(15);
    expect(totalWeight(crit)).toBe(100);
    expect(s.weightHistory[0].source).toBe('learning');
  });

  it('logging a chat replaces earlier feedback for that candidate', () => {
    let s = createSeedState();
    const chat = { id: 'z', candidateId: 'c-sam', roleId: 'ai-eng', outcome: 'maybe' as const, observed: {}, note: '', at: '' };
    s = reducer(s, { type: 'LOG_CHAT', chat });
    expect(s.chats.filter((c) => c.candidateId === 'c-sam')).toHaveLength(1);
    expect(s.chats.length).toBe(SEED_CHATS.length);
  });
});

describe('custom roles', () => {
  it('New role starts with the three company-wide qualities, totals 100, and is selected', () => {
    const s = reducer(createSeedState(), { type: 'ADD_ROLE', title: 'Product Designer', id: 'role-x' });
    const role = s.roles.find((r) => r.id === 'role-x')!;
    expect(role.custom).toBe(true);
    expect(role.criteria.map((c) => c.name)).toEqual(['Builder', 'Curious problem-solver', 'Team-first']);
    expect(role.criteria.every((c) => c.companyWide && c.theme)).toBe(true);
    expect(totalWeight(role.criteria)).toBe(100);
    expect(s.selectedRoleId).toBe('role-x');
    expect(s.weightHistory[0].description).toMatch(/Product Designer/);
  });

  it('criteria can be added to a new role, and Reset clears it', () => {
    let s = reducer(createSeedState(), { type: 'ADD_ROLE', title: 'Designer', id: 'role-y' });
    s = reducer(s, { type: 'ADD_CRITERION', roleId: 'role-y', name: 'Portfolio quality' });
    expect(s.roles.find((r) => r.id === 'role-y')!.criteria).toHaveLength(4);
    expect(totalWeight(s.roles.find((r) => r.id === 'role-y')!.criteria)).toBe(100);
    const reset = reducer(s, { type: 'RESET' });
    expect(reset.roles.some((r) => r.id === 'role-y')).toBe(false);
    expect(reset.roles).toEqual(createSeedState().roles);
  });

  it('only custom roles can be deleted; blank names are ignored', () => {
    let s = reducer(createSeedState(), { type: 'ADD_ROLE', title: 'Designer', id: 'role-z' });
    s = reducer(s, { type: 'DELETE_ROLE', roleId: 'role-z' });
    expect(s.roles.some((r) => r.id === 'role-z')).toBe(false);
    expect(s.selectedRoleId).toBe('ai-eng');
    expect(reducer(s, { type: 'DELETE_ROLE', roleId: 'ai-eng' })).toBe(s);
    expect(reducer(s, { type: 'ADD_ROLE', title: '   ' })).toBe(s);
  });
});
