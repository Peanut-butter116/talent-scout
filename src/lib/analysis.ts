import { OUTCOME_VALUE, type Candidate, type ChatFeedback, type Criterion, type Role } from '../types';

/**
 * Simple, transparent rules — not a statistical model and not AI.
 * Samples are small; the output is indicative only and a human decides.
 */
export const HIGH_PREDICTED_THRESHOLD = 3.5;
/** Outcome gap (high minus low) needed to call a hypothesis "Holding up". */
export const HOLDING_UP_DIFF = 0.3;
/** Each group needs at least this many chats before we call Holding up / Not supported. */
export const MIN_GROUP_SIZE = 2;
/** Average (profile − chat) rating gap that counts as "profiles overstated". */
export const OVERSTATED_GAP = 0.75;

export type HypothesisLabel = 'Not tested yet' | 'Unclear' | 'Holding up' | 'Not supported';

export interface DataPoint {
  candidateId: string;
  roleId: string;
  criterionId: string;
  predicted: number;
  observed?: number;
  outcome: number;
}

export interface CriterionAnalysis {
  criterion: Criterion;
  /** True when chats from other roles with the same theme (e.g. Builder) were included. */
  pooled: boolean;
  n: number;
  highN: number;
  lowN: number;
  highAvg: number | null;
  lowAvg: number | null;
  /** highAvg − lowAvg, when both groups have data. */
  diff: number | null;
  /** Average (profile rating − observed chat rating), where both exist. */
  gap: number | null;
  gapN: number;
  label: HypothesisLabel;
}

/** All (role, criterion) pairs that test the same hypothesis as `criterion` in `role`. */
function matchingCriteria(role: Role, criterion: Criterion, roles: Role[]) {
  if (!criterion.theme) return [{ role, criterion }];
  const pairs: { role: Role; criterion: Criterion }[] = [];
  for (const r of roles) {
    for (const c of r.criteria) {
      if (r.id === role.id ? c.id === criterion.id : c.theme === criterion.theme) {
        pairs.push({ role: r, criterion: c });
      }
    }
  }
  return pairs;
}

export function dataPointsFor(
  role: Role,
  criterion: Criterion,
  roles: Role[],
  candidates: Candidate[],
  chats: ChatFeedback[],
): DataPoint[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const pairs = matchingCriteria(role, criterion, roles);
  const points: DataPoint[] = [];
  for (const chat of chats) {
    const cand = byId.get(chat.candidateId);
    if (!cand) continue;
    for (const p of pairs) {
      if (cand.roleId !== p.role.id) continue;
      const ev = cand.evidence[p.criterion.id];
      if (!ev) continue; // no profile prediction → can't test the hypothesis
      points.push({
        candidateId: cand.id,
        roleId: p.role.id,
        criterionId: p.criterion.id,
        predicted: ev.rating,
        observed: chat.observed[p.criterion.id],
        outcome: OUTCOME_VALUE[chat.outcome],
      });
    }
  }
  return points;
}

export function labelFor(n: number, highN: number, lowN: number, diff: number | null): HypothesisLabel {
  if (n < 2) return 'Not tested yet';
  if (diff === null || highN < MIN_GROUP_SIZE || lowN < MIN_GROUP_SIZE) return 'Unclear';
  if (diff >= HOLDING_UP_DIFF) return 'Holding up';
  if (diff <= 0) return 'Not supported';
  return 'Unclear';
}

export function analyzeCriterion(
  role: Role,
  criterion: Criterion,
  roles: Role[],
  candidates: Candidate[],
  chats: ChatFeedback[],
): CriterionAnalysis {
  const points = dataPointsFor(role, criterion, roles, candidates, chats);
  const high = points.filter((p) => p.predicted >= HIGH_PREDICTED_THRESHOLD);
  const low = points.filter((p) => p.predicted < HIGH_PREDICTED_THRESHOLD);
  const highAvg = avg(high.map((p) => p.outcome));
  const lowAvg = avg(low.map((p) => p.outcome));
  const diff = highAvg !== null && lowAvg !== null ? highAvg - lowAvg : null;
  const withObs = points.filter((p) => p.observed !== undefined);
  const gap = avg(withObs.map((p) => p.predicted - (p.observed as number)));
  return {
    criterion,
    pooled: points.some((p) => p.roleId !== role.id),
    n: points.length,
    highN: high.length,
    lowN: low.length,
    highAvg,
    lowAvg,
    diff,
    gap,
    gapN: withObs.length,
    label: labelFor(points.length, high.length, low.length, diff),
  };
}

export function analyzeRole(
  role: Role,
  roles: Role[],
  candidates: Candidate[],
  chats: ChatFeedback[],
): CriterionAnalysis[] {
  return role.criteria.map((c) => analyzeCriterion(role, c, roles, candidates, chats));
}

/** Criteria where profiles consistently overstated what showed up in chats. */
export function overstatedCriteria(analysis: CriterionAnalysis[]): CriterionAnalysis[] {
  return analysis
    .filter((a) => a.gapN >= 2 && a.gap !== null && a.gap >= OVERSTATED_GAP)
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
}

export interface RubricSuggestion {
  key: string;
  roleId: string;
  lower: { criterionId: string; name: string; from: number; to: number };
  raise: { criterionId: string; name: string; from: number; to: number };
  reason: string;
}

/** Lowest weight we will suggest for a criterion; below this a human should remove it. */
export const MIN_SUGGESTED_WEIGHT = 5;

/**
 * Suggests moving weight from the least-supported criterion to the best-supported one.
 * Returns null when the evidence doesn't point anywhere clear.
 */
export function suggestRubricChange(
  role: Role,
  analysis: CriterionAnalysis[],
): RubricSuggestion | null {
  const lowerCand = analysis
    .filter((a) => a.label === 'Not supported' && a.criterion.weight > MIN_SUGGESTED_WEIGHT)
    .sort((a, b) => (a.diff ?? 0) - (b.diff ?? 0))[0];
  if (!lowerCand) return null;
  const raiseCand = analysis
    .filter((a) => a.label === 'Holding up' && a.criterion.id !== lowerCand.criterion.id)
    .sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0))[0];
  if (!raiseCand) return null;

  const from = lowerCand.criterion.weight;
  const to = Math.max(MIN_SUGGESTED_WEIGHT, Math.round(from / 2 / 5) * 5);
  const delta = from - to;
  if (delta <= 0) return null;

  const lower = { criterionId: lowerCand.criterion.id, name: lowerCand.criterion.name, from, to };
  const raise = {
    criterionId: raiseCand.criterion.id,
    name: raiseCand.criterion.name,
    from: raiseCand.criterion.weight,
    to: raiseCand.criterion.weight + delta,
  };
  const reason =
    `High “${shortName(lower.name)}” scorers did no better in chats ` +
    `(${pct(lowerCand.highAvg)} vs ${pct(lowerCand.lowAvg)} progress score), while high ` +
    `“${shortName(raise.name)}” scorers did much better (${pct(raiseCand.highAvg)} vs ` +
    `${pct(raiseCand.lowAvg)}).`;

  return {
    key: `${role.id}:${lower.criterionId}:${lower.from}->${lower.to}:${raise.criterionId}:${raise.from}->${raise.to}`,
    roleId: role.id,
    lower,
    raise,
    reason,
  };
}

/** "High-bar background (top research lab…)" → "High-bar background" */
export function shortName(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, '').trim() || name;
}

function pct(x: number | null): string {
  return x === null ? '—' : `${Math.round(x * 100)}%`;
}

function avg(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
