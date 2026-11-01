import type { Candidate, MustHaveValue, Role } from '../types';

export type Confidence = 'High' | 'Medium' | 'Low';

export interface CandidateScore {
  /** 0–100, weighted over evidenced criteria only. Null if nothing is evidenced. */
  fit: number | null;
  /** 0–100: share of total weight that has evidence. */
  coverage: number;
  evidencedCount: number;
  totalCount: number;
  /** 0–1: share of evidenced weight backed by strong evidence. */
  strongShare: number;
  confidence: Confidence;
}

/**
 * Fit = weighted average over criteria WITH evidence only (weights re-normalised).
 * Missing evidence never lowers fit — it only lowers coverage and confidence.
 */
export function scoreCandidate(candidate: Candidate, role: Role): CandidateScore {
  let totalWeight = 0;
  let evidencedWeight = 0;
  let weightedSum = 0;
  let strongWeight = 0;
  let evidencedCount = 0;

  for (const c of role.criteria) {
    totalWeight += c.weight;
    const e = candidate.evidence[c.id];
    if (!e) continue;
    evidencedCount += 1;
    evidencedWeight += c.weight;
    weightedSum += c.weight * (clamp(e.rating, 0, 5) / 5);
    if (e.strength === 'strong') strongWeight += c.weight;
  }

  const fit = evidencedWeight > 0 ? (weightedSum / evidencedWeight) * 100 : null;
  const coverage = totalWeight > 0 ? (evidencedWeight / totalWeight) * 100 : 0;
  const strongShare = evidencedWeight > 0 ? strongWeight / evidencedWeight : 0;

  return {
    fit,
    coverage,
    evidencedCount,
    totalCount: role.criteria.length,
    strongShare,
    confidence: confidenceFor(coverage, strongShare),
  };
}

export function confidenceFor(coverage: number, strongShare: number): Confidence {
  if (coverage >= 80 && strongShare >= 0.6) return 'High';
  if (coverage < 50 || strongShare < 0.3) return 'Low';
  return 'Medium';
}

export interface MustHaveCheck {
  id: string;
  label: string;
  value: MustHaveValue;
}

export interface MustHaveResult {
  /** True only when an enabled must-have is explicitly "No". Unknown never flags. */
  flagged: boolean;
  checks: MustHaveCheck[];
  unknownCount: number;
}

export function checkMustHaves(candidate: Candidate, role: Role): MustHaveResult {
  const checks: MustHaveCheck[] = role.mustHaves
    .filter((m) => m.enabled)
    .map((m) => ({ id: m.id, label: m.label, value: candidate.mustHaves[m.id] ?? 'unknown' }));
  return {
    flagged: checks.some((c) => c.value === 'no'),
    checks,
    unknownCount: checks.filter((c) => c.value === 'unknown').length,
  };
}

export interface RankedCandidate {
  candidate: Candidate;
  score: CandidateScore;
  mustHaves: MustHaveResult;
  rank: number;
}

/** Ranks candidates for one role: fit desc (no evidence last), then coverage, then name. */
export function rankCandidates(candidates: Candidate[], role: Role): RankedCandidate[] {
  return candidates
    .filter((c) => c.roleId === role.id)
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, role),
      mustHaves: checkMustHaves(candidate, role),
      rank: 0,
    }))
    .sort(compareRanked)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function compareRanked(a: RankedCandidate, b: RankedCandidate): number {
  const fa = a.score.fit ?? -1;
  const fb = b.score.fit ?? -1;
  if (fb !== fa) return fb - fa;
  if (b.score.coverage !== a.score.coverage) return b.score.coverage - a.score.coverage;
  return a.candidate.name.localeCompare(b.candidate.name);
}

/** Criteria the candidate has no evidence for, or only weak evidence — "what's uncertain". */
export function uncertainties(candidate: Candidate, role: Role) {
  const missing = role.criteria.filter((c) => !candidate.evidence[c.id]);
  const weak = role.criteria.filter((c) => candidate.evidence[c.id]?.strength === 'weak');
  return { missing, weak };
}

/** The candidate's strongest evidence for this role (strong first, then rating × weight). */
export function strongestEvidence(candidate: Candidate, role: Role, count = 2) {
  return role.criteria
    .map((c) => ({ criterion: c, evidence: candidate.evidence[c.id] }))
    .filter((x): x is { criterion: typeof x.criterion; evidence: NonNullable<typeof x.evidence> } =>
      Boolean(x.evidence),
    )
    .sort((a, b) => {
      const sa = a.evidence.strength === 'strong' ? 1 : 0;
      const sb = b.evidence.strength === 'strong' ? 1 : 0;
      if (sb !== sa) return sb - sa;
      return b.evidence.rating * b.criterion.weight - a.evidence.rating * a.criterion.weight;
    })
    .slice(0, count);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
