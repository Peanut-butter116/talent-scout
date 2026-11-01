export type SourceChannel = 'LinkedIn direct' | 'Network referral' | 'Agency' | 'Inbound';

export const SOURCE_CHANNELS: SourceChannel[] = [
  'LinkedIn direct',
  'Network referral',
  'Agency',
  'Inbound',
];

/**
 * Criteria that share a theme are pooled across roles in the Learning analysis
 * (e.g. every role has a "Builder" criterion, so all chats can test it).
 */
export type CriterionTheme = 'builder' | 'sharp' | 'lowEgo' | 'pedigree';

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  theme?: CriterionTheme;
  /** Glot-wide qualities appear in every role. */
  glotWide?: boolean;
}

export interface MustHave {
  id: string;
  label: string;
  enabled: boolean;
}

export interface Role {
  id: string;
  title: string;
  summary: string;
  criteria: Criterion[];
  mustHaves: MustHave[];
}

export type EvidenceStrength = 'strong' | 'weak';

export interface Evidence {
  /** 0–5 */
  rating: number;
  strength: EvidenceStrength;
  note: string;
}

export type MustHaveValue = 'yes' | 'no' | 'unknown';

export type PipelineStatus =
  | 'new'
  | 'suggested'
  | 'approved'
  | 'contacted'
  | 'booked'
  | 'done'
  | 'skipped';

export interface Candidate {
  id: string;
  name: string;
  headline: string;
  employer: string;
  roleId: string;
  source: SourceChannel;
  /** Keyed by criterion id. A missing key means no evidence. */
  evidence: Record<string, Evidence | undefined>;
  /** Keyed by must-have id. A missing key means unknown. */
  mustHaves: Record<string, MustHaveValue | undefined>;
  status: PipelineStatus;
  shortlistedAt?: string;
  contactedAt?: string;
  /** Set from Quick review: the CEO wants to meet this person personally. */
  priority?: boolean;
  /** Candidate replied to outreach (while in Contacted). Booked/done imply replied. */
  replied?: boolean;
  skipReason?: SkipReason;
}

export type SkipReason = 'not_enough_evidence' | 'wrong_seniority' | 'missing_skill' | 'other';

export const SKIP_REASONS: { id: SkipReason; label: string }[] = [
  { id: 'not_enough_evidence', label: 'Not enough evidence' },
  { id: 'wrong_seniority', label: 'Wrong seniority' },
  { id: 'missing_skill', label: 'Missing key skill' },
  { id: 'other', label: 'Other' },
];

export type ReviewDecision = 'approve' | 'skip' | 'priority';

/** One Quick review decision. Holds the previous values so it can be undone. */
export interface ReviewEntry {
  id: string;
  candidateId: string;
  roleId: string;
  decision: ReviewDecision;
  reason?: SkipReason;
  at: string;
  prev: { status: PipelineStatus; priority?: boolean; skipReason?: SkipReason };
}

export type ChatOutcome = 'progress' | 'maybe' | 'not_fit';

export const OUTCOME_VALUE: Record<ChatOutcome, number> = {
  progress: 1,
  maybe: 0.5,
  not_fit: 0,
};

export const OUTCOME_LABEL: Record<ChatOutcome, string> = {
  progress: 'Progress',
  maybe: 'Maybe',
  not_fit: 'Not a fit',
};

export interface ChatFeedback {
  id: string;
  candidateId: string;
  roleId: string;
  outcome: ChatOutcome;
  /** Observed 0–5 rating per criterion id. Skipped criteria are absent. */
  observed: Record<string, number | undefined>;
  note: string;
  at: string;
}

export interface WeightChange {
  id: string;
  at: string;
  roleId: string;
  source: 'manual' | 'learning';
  description: string;
  /** Used to merge rapid slider moves on the same criterion into one entry. */
  criterionId?: string;
  from?: number;
  to?: number;
}
