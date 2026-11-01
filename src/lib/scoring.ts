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
  /** 0–1: strong = 1, weak = 0.6, averaged over evidenced weight. */
  quality: number;
  /** 0–1: confirmed by a person = 0.85, also seen in a coffee chat = 1, averaged by weight. */
  verification: number;
  /** 0–100 = coverage × quality × verification. */
  confidenceScore: number;
  confidence: Confidence;
}

/** Transparent confidence parts (see How it works). */
export const QUALITY_WEIGHT = { strong: 1, weak: 0.6 } as const;
export const VERIFICATION_WEIGHT = { person: 0.85, chat: 1 } as const;
export const CONFIDENCE_BANDS = { high: 65, medium: 40 } as const;

/**
 * Fit = weighted average over criteria WITH evidence only (weights re-normalised).
 * Missing evidence never lowers fit — it only lowers coverage and confidence.
 */
export function scoreCandidate(candidate: Candidate, role: Role): CandidateScore {
  let totalWeight = 0;
  let evidencedWeight = 0;
  let weightedSum = 0;
  let strongWeight = 0;
  let qualitySum = 0;
  let verificationSum = 0;
  let evidencedCount = 0;

  for (const c of role.criteria) {
    totalWeight += c.weight;
    const e = candidate.evidence[c.id];
    if (!e) continue;
    evidencedCount += 1;
    evidencedWeight += c.weight;
    weightedSum += c.weight * (clamp(e.rating, 0, 5) / 5);
    if (e.strength === 'strong') strongWeight += c.weight;
    qualitySum += c.weight * QUALITY_WEIGHT[e.strength];
    // Saved evidence is always confirmed by a person (demo data or "you"); a chat adds more.
    verificationSum += c.weight * (e.checkedInChat ? VERIFICATION_WEIGHT.chat : VERIFICATION_WEIGHT.person);
  }

  const fit = evidencedWeight > 0 ? (weightedSum / evidencedWeight) * 100 : null;
  const coverage = totalWeight > 0 ? (evidencedWeight / totalWeight) * 100 : 0;
  const strongShare = evidencedWeight > 0 ? strongWeight / evidencedWeight : 0;
  const quality = evidencedWeight > 0 ? qualitySum / evidencedWeight : 0;
  const verification = evidencedWeight > 0 ? verificationSum / evidencedWeight : 0;
  const confidenceScore = confidenceScoreFor(coverage / 100, quality, verification);

  return {
    fit,
    coverage,
    evidencedCount,
    totalCount: role.criteria.length,
    strongShare,
    quality,
    verification,
    confidenceScore,
    confidence: confidenceLabel(confidenceScore),
  };
}

/** coverage (0–1) × quality (0–1) × verification (0–1) → 0–100. */
export function confidenceScoreFor(coverage: number, quality: number, verification: number): number {
  return Math.round(clamp(coverage, 0, 1) * clamp(quality, 0, 1) * clamp(verification, 0, 1) * 1000) / 10;
}

export function confidenceLabel(score: number): Confidence {
  if (score >= CONFIDENCE_BANDS.high) return 'High';
  if (score >= CONFIDENCE_BANDS.medium) return 'Medium';
  return 'Low';
}

/** Marks evidence that a logged coffee chat also rated (observed rating present). */
export function applyChatChecks<T extends Candidate>(
  candidates: T[],
  chats: { candidateId: string; observed: Record<string, number | undefined> }[],
): T[] {
  const byCand = new Map(chats.map((c) => [c.candidateId, c]));
  return candidates.map((c) => {
    const chat = byCand.get(c.id);
    let changed = false;
    const evidence: Candidate['evidence'] = {};
    for (const [k, e] of Object.entries(c.evidence)) {
      if (!e) continue;
      const checked = Boolean(chat && chat.observed[k] !== undefined);
      if (Boolean(e.checkedInChat) !== checked) changed = true;
      const next = { ...e };
      if (checked) next.checkedInChat = true;
      else delete next.checkedInChat;
      evidence[k] = next;
    }
    return changed ? { ...c, evidence } : c;
  });
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
  /**
   * Ranking score: raw fit shrunk towards a neutral 50 by how much is unknown.
   * cautious = coverage × fit + (1 − coverage) × 50. Equals fit at full coverage.
   */
  cautiousFit: number;
  /** Coverage below NEEDS_EVIDENCE_COVERAGE → find out more before contacting. */
  needsMoreEvidence: boolean;
  rank: number;
}

export type SortMode = 'cautious' | 'raw';

/** Below this coverage (%), a candidate is tagged "Needs more evidence". */
export const NEEDS_EVIDENCE_COVERAGE = 40;

/** What we assume about the unknown part of a profile: neither good nor bad. */
export const NEUTRAL_FIT = 50;

export function cautiousFit(score: Pick<CandidateScore, 'fit' | 'coverage'>): number {
  const cov = score.coverage / 100;
  return cov * (score.fit ?? NEUTRAL_FIT) + (1 - cov) * NEUTRAL_FIT;
}

/**
 * Ranks candidates for one role. Default sort is cautious fit, so thin profiles don't float
 * to the top on a couple of good ratings. Raw sort orders by fit alone.
 */
export function rankCandidates(
  candidates: Candidate[],
  role: Role,
  sort: SortMode = 'cautious',
): RankedCandidate[] {
  const scored = candidates
    .filter((c) => c.roleId === role.id)
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, role) }));
  return scored
    .map(({ candidate, score }) => ({
      candidate,
      score,
      mustHaves: checkMustHaves(candidate, role),
      cautiousFit: cautiousFit(score),
      needsMoreEvidence: score.coverage < NEEDS_EVIDENCE_COVERAGE,
      rank: 0,
    }))
    .sort(sort === 'raw' ? compareRaw : compareCautious)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function tieBreak(a: RankedCandidate, b: RankedCandidate): number {
  if (b.score.coverage !== a.score.coverage) return b.score.coverage - a.score.coverage;
  return a.candidate.name.localeCompare(b.candidate.name);
}

export function compareCautious(a: RankedCandidate, b: RankedCandidate): number {
  // Candidates with no evidence at all go last regardless of the blended score.
  const ea = a.score.fit === null ? 1 : 0;
  const eb = b.score.fit === null ? 1 : 0;
  if (ea !== eb) return ea - eb;
  if (b.cautiousFit !== a.cautiousFit) return b.cautiousFit - a.cautiousFit;
  return tieBreak(a, b);
}

export function compareRaw(a: RankedCandidate, b: RankedCandidate): number {
  const fa = a.score.fit ?? -1;
  const fb = b.score.fit ?? -1;
  if (fb !== fa) return fb - fa;
  return tieBreak(a, b);
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
