import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_ROLES } from '../data/roles';
import type { ReviewDecision, SkipReason } from '../types';

/**
 * Share links for the CEO review. State lives in each person's browser, so the link itself
 * carries the shortlist — but ONLY ids: role id, week, seeded candidate ids, and decisions.
 * Never names, evidence or anything personal. Everything goes in the URL hash, which the
 * browser never sends to a server.
 */

export const SHARE_VERSION = '1';
export const MAX_SHARED = 10;

const SEED_IDS = new Set(SEED_CANDIDATES.map((c) => c.id));
const ROLE_IDS = new Set(SEED_ROLES.map((r) => r.id));
const ID_RE = /^c-[a-z0-9-]{1,40}$/;
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Only seeded (fictional) candidates can travel in a link. */
export function isShareable(candidateId: string): boolean {
  return SEED_IDS.has(candidateId);
}

export interface ReviewLink {
  /** Role id, or 'all' for a cross-role shortlist. */
  roleId: string;
  week: string;
  candidateIds: string[];
}

export type DecisionCode = { decision: ReviewDecision; reason?: SkipReason };

export interface ResultsLink extends ReviewLink {
  decisions: Record<string, DecisionCode>;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const REASON_CODE: Record<SkipReason, string> = {
  not_enough_evidence: 'e',
  wrong_seniority: 'w',
  missing_skill: 'm',
  other: 'o',
};
const CODE_REASON = Object.fromEntries(Object.entries(REASON_CODE).map(([k, v]) => [v, k])) as Record<
  string,
  SkipReason
>;
const DECISION_CODE: Record<ReviewDecision, string> = { approve: 'a', skip: 's', priority: 'p' };
const CODE_DECISION = Object.fromEntries(Object.entries(DECISION_CODE).map(([k, v]) => [v, k])) as Record<
  string,
  ReviewDecision
>;

/** YYYY-MM-DD of the given date (local time). */
export function weekKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function base(link: ReviewLink): URLSearchParams {
  const p = new URLSearchParams();
  p.set('v', SHARE_VERSION);
  p.set('r', link.roleId);
  p.set('w', link.week);
  return p;
}

/** Hash for /review, e.g. "#v=1&r=ai-eng&w=2026-11-02&c=c-sam,c-jordan". */
export function encodeReviewHash(link: ReviewLink): string {
  const p = base(link);
  p.set('c', link.candidateIds.filter(isShareable).slice(0, MAX_SHARED).join(','));
  return '#' + p.toString();
}

/** Hash for the main app that carries the CEO's decisions back. */
export function encodeResultsHash(link: ResultsLink): string {
  const p = base(link);
  p.set('ceo', '1');
  const d = link.candidateIds
    .filter((id) => isShareable(id) && link.decisions[id])
    .slice(0, MAX_SHARED)
    .map((id) => {
      const { decision, reason } = link.decisions[id];
      return `${id}:${DECISION_CODE[decision]}${decision === 'skip' && reason ? REASON_CODE[reason] : ''}`;
    });
  p.set('d', d.join(','));
  return '#' + p.toString();
}

function parseBase(hash: string): Parsed<{ p: URLSearchParams; roleId: string; week: string }> {
  if (!hash || hash.length > 2000) return { ok: false, error: 'This link is empty or too long.' };
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(hash.replace(/^#/, ''));
  } catch {
    return { ok: false, error: 'This link could not be read.' };
  }
  if (p.get('v') !== SHARE_VERSION) return { ok: false, error: 'This link is from a different version of the demo.' };
  const roleId = p.get('r') ?? '';
  if (roleId !== 'all' && !ROLE_IDS.has(roleId)) return { ok: false, error: 'This link names an unknown role.' };
  const week = p.get('w') ?? '';
  if (!WEEK_RE.test(week) || Number.isNaN(Date.parse(week))) return { ok: false, error: 'This link has an invalid week.' };
  return { ok: true, value: { p, roleId, week } };
}

/** Keeps only well-formed, seeded, de-duplicated ids (max 10). */
function cleanIds(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of raw) {
    if (!ID_RE.test(id) || !SEED_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_SHARED) break;
  }
  return out;
}

export function decodeReviewHash(hash: string): Parsed<ReviewLink> {
  const b = parseBase(hash);
  if (!b.ok) return b;
  const raw = (b.value.p.get('c') ?? '').split(',').filter(Boolean);
  const candidateIds = cleanIds(raw);
  if (candidateIds.length === 0) return { ok: false, error: 'This link has no candidates to review.' };
  return { ok: true, value: { roleId: b.value.roleId, week: b.value.week, candidateIds } };
}

export function isResultsHash(hash: string): boolean {
  return /[#&]ceo=1(&|$)/.test(hash);
}

export function decodeResultsHash(hash: string): Parsed<ResultsLink> {
  const b = parseBase(hash);
  if (!b.ok) return b;
  if (b.value.p.get('ceo') !== '1') return { ok: false, error: 'This is not a decisions link.' };
  const decisions: Record<string, DecisionCode> = {};
  const ids: string[] = [];
  for (const part of (b.value.p.get('d') ?? '').split(',').filter(Boolean)) {
    const [id, code = ''] = part.split(':');
    const decision = CODE_DECISION[code.charAt(0)];
    if (!decision || cleanIds([id]).length === 0 || decisions[id]) continue;
    const reasonCode = code.slice(1);
    if (code.length > 2 || (reasonCode && (decision !== 'skip' || !CODE_REASON[reasonCode]))) continue;
    decisions[id] = decision === 'skip' && reasonCode ? { decision, reason: CODE_REASON[reasonCode] } : { decision };
    ids.push(id);
    if (ids.length >= MAX_SHARED) break;
  }
  if (ids.length === 0) return { ok: false, error: 'This link has no valid decisions.' };
  return { ok: true, value: { roleId: b.value.roleId, week: b.value.week, candidateIds: ids, decisions } };
}

export function summarise(decisions: Record<string, DecisionCode>) {
  const vals = Object.values(decisions);
  return {
    approved: vals.filter((d) => d.decision === 'approve').length,
    priority: vals.filter((d) => d.decision === 'priority').length,
    skipped: vals.filter((d) => d.decision === 'skip').length,
  };
}

/**
 * Which decisions can be applied: only to candidates that exist here and are still waiting
 * in Suggested (or not yet shortlisted). Anything already moved on is left alone.
 */
export function planImport(
  candidates: { id: string; status: string }[],
  results: ResultsLink,
): { apply: string[]; ignored: string[] } {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const apply: string[] = [];
  const ignored: string[] = [];
  for (const id of results.candidateIds) {
    const c = byId.get(id);
    if (c && (c.status === 'suggested' || c.status === 'new')) apply.push(id);
    else ignored.push(id);
  }
  return { apply, ignored };
}
