import { Check, Copy, Link2Off, PartyPopper } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DemoBadge } from '../components/DemoBadge';
import { DISCLAIMER } from '../components/Disclaimer';
import { DecisionSummary } from '../components/QuickReview';
import { ReviewStack } from '../components/ReviewStack';
import { rankCandidates, type RankedCandidate } from '../lib/scoring';
import { decodeReviewHash, encodeResultsHash, type DecisionCode, type ReviewLink } from '../lib/share';
import { useAppState } from '../state/AppState';
import type { ReviewDecision, SkipReason } from '../types';

type Mode = 'live' | 'detached';
interface Session {
  mode: Mode;
  decisions: Record<string, DecisionCode>;
  order: string[];
}

const sessionKey = (hash: string) => `talent-scout:review:${hash}`;

function readSession(hash: string): Session | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(hash));
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
function writeSession(hash: string, s: Session) {
  try {
    sessionStorage.setItem(sessionKey(hash), JSON.stringify(s));
  } catch {
    // ignore: progress just won't survive a reload
  }
}

/** Standalone, full-screen CEO review: the swipe stack only. Opened from a share link. */
export function ReviewPage() {
  const location = useLocation();
  const parsed = useMemo(() => decodeReviewHash(location.hash), [location.hash]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-ink-900">Talent Scout</span>
        <DemoBadge />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-4">
        {parsed.ok ? (
          <ReviewSession link={parsed.value} hash={location.hash} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Link2Off className="mb-3 h-6 w-6 text-ink-400" />
            <h1 className="text-xl font-semibold text-ink-900">This link doesn't work</h1>
            <p className="mt-1 text-sm text-ink-500">{parsed.error}</p>
            <Link to="/pipeline" className="btn-primary mt-6">Open the app</Link>
          </div>
        )}
      </div>
      <p className="px-4 pb-4 text-center text-[11px] text-ink-400">{DISCLAIMER}</p>
    </div>
  );
}

function ReviewSession({ link, hash }: { link: ReviewLink; hash: string }) {
  const { state, dispatch } = useAppState();

  const [session, setSession] = useState<Session>(() => {
    const saved = readSession(hash);
    if (saved) return saved;
    // Same browser as the board? Then every linked candidate is already on this board.
    const statuses = link.candidateIds.map((id) => state.candidates.find((c) => c.id === id)?.status);
    const live = statuses.some((s) => s === 'suggested') && statuses.every((s) => s === 'suggested' || s === 'approved' || s === 'skipped');
    return { mode: live ? 'live' : 'detached', decisions: {}, order: [] };
  });
  const [frontId, setFrontId] = useState<string | null>(null);
  useEffect(() => writeSession(hash, session), [hash, session]);

  const roleOf = useCallback((id: string) => state.roles.find((r) => r.id === id)!, [state.roles]);
  const byId = useMemo(() => {
    const m = new Map<string, RankedCandidate>();
    for (const r of state.roles) for (const x of rankCandidates(state.candidates, r)) m.set(x.candidate.id, x);
    return m;
  }, [state.roles, state.candidates]);

  const remaining = useMemo(() => {
    const list = link.candidateIds.filter((id) => !session.decisions[id] && byId.has(id)).map((id) => byId.get(id)!);
    if (frontId) {
      const i = list.findIndex((r) => r.candidate.id === frontId);
      if (i > 0) list.unshift(...list.splice(i, 1));
    }
    return list;
  }, [link.candidateIds, session.decisions, byId, frontId]);

  const total = link.candidateIds.filter((id) => byId.has(id)).length;
  const position = Math.min(total, session.order.length + 1);
  const role = link.roleId === 'all' ? null : roleOf(link.roleId);

  const onDecide = useCallback(
    (candidateId: string, decision: ReviewDecision, reason?: SkipReason) => {
      if (session.mode === 'live') dispatch({ type: 'REVIEW_DECISION', candidateId, decision, reason });
      setSession((s) => ({
        ...s,
        decisions: { ...s.decisions, [candidateId]: reason ? { decision, reason } : { decision } },
        order: [...s.order, candidateId],
      }));
      setFrontId(null);
    },
    [dispatch, session.mode],
  );

  const onUndo = useCallback(() => {
    const last = session.order[session.order.length - 1];
    if (!last) return;
    if (session.mode === 'live' && state.reviewLog[state.reviewLog.length - 1]?.candidateId === last) {
      dispatch({ type: 'UNDO_REVIEW' });
    }
    setSession((s) => {
      const decisions = { ...s.decisions };
      delete decisions[last];
      return { ...s, decisions, order: s.order.slice(0, -1) };
    });
    setFrontId(last);
  }, [dispatch, session, state.reviewLog]);

  return (
    <>
      <header className="pb-1 pt-4 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">This week's shortlist</h1>
        <p className="mt-0.5 text-sm text-ink-500">
          {role ? role.title : 'All roles'} · {remaining.length ? `${position} of ${total}` : 'Done'}
        </p>
      </header>
      <ReviewStack
        items={remaining}
        roleOf={roleOf}
        showRole={link.roleId === 'all'}
        onDecide={onDecide}
        onUndo={onUndo}
        canUndo={session.order.length > 0}
        done={<Done link={link} session={session} onUndo={session.order.length ? onUndo : undefined} />}
      />
    </>
  );
}

function Done({ link, session, onUndo }: { link: ReviewLink; session: Session; onUndo?: () => void }) {
  const { state } = useAppState();
  const [copied, setCopied] = useState(false);
  const name = (id: string) => state.candidates.find((c) => c.id === id)?.name ?? id;
  const resultsUrl = `${window.location.origin}/pipeline${encodeResultsHash({ ...link, candidateIds: session.order, decisions: session.decisions })}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="w-full max-w-sm text-center">
      <PartyPopper className="mx-auto mb-3 h-6 w-6 text-teal-700" />
      <h2 className="text-xl font-semibold text-ink-900">All reviewed</h2>
      <DecisionSummary
        rows={session.order.map((id) => ({ name: name(id), decision: session.decisions[id].decision, reason: session.decisions[id].reason }))}
      />
      <div className="mt-6 flex flex-col gap-2">
        {session.mode === 'live' ? (
          <>
            <p className="text-sm text-ink-500">Saved to your pipeline.</p>
            <Link to="/pipeline" className="btn-primary w-full">Open pipeline</Link>
          </>
        ) : (
          <>
            <button className="btn-primary w-full" onClick={copy} disabled={session.order.length === 0}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Link copied' : 'Send decisions back'}
            </button>
            {copied && <p className="text-xs text-ink-400">Paste it to whoever shared the shortlist.</p>}
            <input
              readOnly
              value={resultsUrl}
              aria-label="Decisions link"
              onFocus={(e) => e.currentTarget.select()}
              className="input text-xs text-ink-500"
            />
          </>
        )}
        {onUndo && <button className="btn-ghost w-full text-xs" onClick={onUndo}>Undo last</button>}
      </div>
    </div>
  );
}
