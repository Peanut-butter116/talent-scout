import { describe, expect, it } from 'vitest';
import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_CHATS } from '../data/chats';
import { SEED_ROLES } from '../data/roles';
import { computeKpis, draftOutreach, pickShortlist, resultsBySource, startOfWeek } from './pipeline';

describe('pickShortlist', () => {
  it('only picks candidates not yet shortlisted or contacted', () => {
    const ids = pickShortlist(SEED_CANDIDATES, SEED_ROLES, null);
    expect(ids.length).toBe(5);
    for (const id of ids) expect(SEED_CANDIDATES.find((c) => c.id === id)!.status).toBe('new');
  });

  it('uses cautious fit, so thin profiles are not picked first', () => {
    const ids = pickShortlist(SEED_CANDIDATES, SEED_ROLES, 'ai-eng', 2);
    expect(ids).not.toContain('c-alexis');
  });

  it('respects the selected role', () => {
    const ids = pickShortlist(SEED_CANDIDATES, SEED_ROLES, 'ai-eng');
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(SEED_CANDIDATES.find((c) => c.id === id)!.roleId).toBe('ai-eng');
  });

  it('must-have Unknown never excludes; explicit No does', () => {
    const avery = SEED_CANDIDATES.find((c) => c.id === 'c-avery')!; // rtw unknown
    expect(avery.mustHaves.rtw).toBeUndefined();
    expect(pickShortlist(SEED_CANDIDATES, SEED_ROLES, 'bizops')).toContain('c-avery');
    const withNo = SEED_CANDIDATES.map((c) => (c.id === 'c-avery' ? { ...c, mustHaves: { rtw: 'no' as const } } : c));
    expect(pickShortlist(withNo, SEED_ROLES, 'bizops')).not.toContain('c-avery');
  });
});

describe('kpis and sources', () => {
  it('computes reply rate from contacted candidates', () => {
    const k = computeKpis(SEED_CANDIDATES, new Date('2026-11-02T12:00:00Z'));
    expect(k.contacted).toBe(14);
    expect(k.replied).toBe(12);
    expect(k.chatsDone).toBe(11);
    expect(k.chatsBooked).toBe(1);
  });

  it('direct sourcing progresses more than agency in the seed', () => {
    const rows = resultsBySource(SEED_CANDIDATES, SEED_CHATS);
    const direct = rows.find((r) => r.source === 'LinkedIn direct')!;
    const agency = rows.find((r) => r.source === 'Agency')!;
    const rate = (r: typeof direct) => r.progressed / r.contacted;
    expect(rate(direct)).toBeGreaterThan(rate(agency));
    // Believable, not extreme: agency still progresses someone.
    expect(agency.progressed).toBeGreaterThanOrEqual(1);
    expect(agency.contacted).toBeGreaterThanOrEqual(5);
  });

  it('week starts on Monday', () => {
    expect(startOfWeek(new Date('2026-11-04T10:00:00')).getDay()).toBe(1);
  });
});

describe('draftOutreach', () => {
  it('references the strongest evidence', () => {
    const sam = SEED_CANDIDATES.find((c) => c.id === 'c-sam')!;
    const text = draftOutreach(sam, SEED_ROLES[0]);
    expect(text).toContain('Hi Sam');
    expect(text).toContain('Northwind Labs, a 10-person AI startup');
    expect(text).toMatch(/streaming ASR|noise suppression/);
  });
});

describe('draftOutreach evidence', () => {
  it('never quotes weak evidence', () => {
    for (const c of SEED_CANDIDATES) {
      const role = SEED_ROLES.find((r) => r.id === c.roleId)!;
      const text = draftOutreach(c, role);
      for (const e of Object.values(c.evidence)) {
        if (e?.strength === 'weak') expect(text.toLowerCase()).not.toContain(e.note.toLowerCase().slice(1, 30));
      }
    }
  });
});
