import {
  OUTCOME_VALUE,
  SOURCE_CHANNELS,
  type Candidate,
  type ChatFeedback,
  type PipelineStatus,
  type Role,
  type SourceChannel,
} from '../types';
import { rankCandidates, strongestEvidence } from './scoring';

export const PIPELINE_COLUMNS: { status: PipelineStatus; label: string }[] = [
  { status: 'suggested', label: 'Suggested' },
  { status: 'approved', label: 'Approved' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'booked', label: 'Chat booked' },
  { status: 'done', label: 'Chat done' },
  { status: 'skipped', label: 'Skipped' },
];

export const STATUS_LABEL: Record<PipelineStatus, string> = {
  new: 'Not shortlisted',
  suggested: 'Suggested',
  approved: 'Approved',
  contacted: 'Contacted',
  booked: 'Chat booked',
  done: 'Chat done',
  skipped: 'Skipped',
};

const CONTACTED: PipelineStatus[] = ['contacted', 'booked', 'done'];
const REPLIED: PipelineStatus[] = ['booked', 'done'];

export const SHORTLIST_SIZE = 5;

/**
 * Picks the top candidates who haven't been shortlisted or contacted yet.
 * Must-have "Unknown" never excludes; only an explicit "No" does.
 * Pass roleId = null for all roles.
 */
export function pickShortlist(
  candidates: Candidate[],
  roles: Role[],
  roleId: string | null,
  size = SHORTLIST_SIZE,
): string[] {
  const pool = roles
    .filter((r) => roleId === null || r.id === roleId)
    .flatMap((r) => rankCandidates(candidates, r));
  return pool
    .filter((r) => r.candidate.status === 'new' && !r.mustHaves.flagged && r.score.fit !== null)
    .sort((a, b) => (b.score.fit ?? 0) - (a.score.fit ?? 0) || b.score.coverage - a.score.coverage)
    .slice(0, size)
    .map((r) => r.candidate.id);
}

export function startOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export interface Kpis {
  shortlistedThisWeek: number;
  contacted: number;
  replied: number;
  replyRate: number | null;
  chatsBooked: number;
  chatsDone: number;
}

export function computeKpis(candidates: Candidate[], now = new Date()): Kpis {
  const weekStart = startOfWeek(now).getTime();
  const contacted = candidates.filter((c) => CONTACTED.includes(c.status)).length;
  const replied = candidates.filter((c) => REPLIED.includes(c.status)).length;
  return {
    shortlistedThisWeek: candidates.filter(
      (c) => c.shortlistedAt && new Date(c.shortlistedAt).getTime() >= weekStart,
    ).length,
    contacted,
    replied,
    replyRate: contacted ? replied / contacted : null,
    chatsBooked: candidates.filter((c) => c.status === 'booked').length,
    chatsDone: candidates.filter((c) => c.status === 'done').length,
  };
}

export interface SourceRow {
  source: SourceChannel;
  contacted: number;
  replied: number;
  chats: number;
  progressed: number;
}

export function resultsBySource(candidates: Candidate[], chats: ChatFeedback[]): SourceRow[] {
  const progressedIds = new Set(
    chats.filter((c) => OUTCOME_VALUE[c.outcome] === 1).map((c) => c.candidateId),
  );
  return SOURCE_CHANNELS.map((source) => {
    const group = candidates.filter((c) => c.source === source);
    return {
      source,
      contacted: group.filter((c) => CONTACTED.includes(c.status)).length,
      replied: group.filter((c) => REPLIED.includes(c.status)).length,
      chats: group.filter((c) => c.status === 'done').length,
      progressed: group.filter((c) => progressedIds.has(c.id)).length,
    };
  });
}

/** Editable outreach template referencing the candidate's strongest evidence. Never sent. */
export function draftOutreach(candidate: Candidate, role: Role): string {
  const first = candidate.name.split(' ')[0];
  const hooks = strongestEvidence(candidate, role).map((x) => lowerFirst(x.evidence.note));
  const hookLine = hooks.length
    ? `I came across your work — ${hooks.join(', and ')} — and it stood out.`
    : `I came across your profile and your background stood out.`;
  return [
    `Hi ${first},`,
    ``,
    `${hookLine}`,
    ``,
    `I'm hiring a ${role.title} at Glot. We're building real-time translation for real-world conversations, and we care most about people who build things. Would you be open to a 20-minute coffee chat next week? No prep needed — just a conversation.`,
    ``,
    `Best,`,
    `[Your name]`,
  ].join('\n');
}

function lowerFirst(s: string): string {
  // Keep acronyms/proper nouns like "ASR" or "Go" intact.
  if (/^[A-Z]{2}/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
