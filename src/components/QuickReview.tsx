import { PartyPopper, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { REVIEW_WEEKLY_CAP, reviewDeck, reviewsThisWeek } from '../lib/pipeline';
import { useAppState } from '../state/AppState';
import { SKIP_REASONS, type Candidate, type ReviewDecision, type SkipReason } from '../types';
import { OutreachModal } from './OutreachModal';
import { ReviewStack } from './ReviewStack';

/** In-app Quick review: a modal around the shared swipe stack, writing straight to the pipeline. */
export function QuickReview({ roleId, onClose }: { roleId: string | null; onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const [frontId, setFrontId] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [contact, setContact] = useState<Candidate | null>(null);

  const deck = useMemo(() => {
    const d = reviewDeck(state.candidates, state.roles, roleId, state.reviewLog);
    if (frontId) {
      const i = d.findIndex((r) => r.candidate.id === frontId);
      if (i > 0) d.unshift(...d.splice(i, 1));
    }
    return d;
  }, [state.candidates, state.roles, roleId, state.reviewLog, frontId]);

  const weekLog = reviewsThisWeek(state.reviewLog);
  const roleOf = useCallback((id: string) => state.roles.find((r) => r.id === id)!, [state.roles]);

  const onDecide = useCallback(
    (candidateId: string, decision: ReviewDecision, reason?: SkipReason) => {
      dispatch({ type: 'REVIEW_DECISION', candidateId, decision, reason });
      setSessionCount((n) => n + 1);
      setFrontId(null);
    },
    [dispatch],
  );

  const onUndo = useCallback(() => {
    const last = state.reviewLog[state.reviewLog.length - 1];
    if (!last) return;
    dispatch({ type: 'UNDO_REVIEW' });
    setFrontId(last.candidateId);
    setSessionCount((n) => Math.max(0, n - 1));
  }, [dispatch, state.reviewLog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !contact && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, contact]);

  const total = sessionCount + deck.length;
  const capLeft = Math.max(0, REVIEW_WEEKLY_CAP - weekLog.length);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink-950/40 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Quick review">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-ink-50 px-5 pb-4 pt-4 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-ink-900">Review shortlist</div>
            <div className="text-xs text-ink-400">
              {deck.length ? `${Math.min(total, sessionCount + 1)} of ${total}` : 'Done'} · {capLeft} left this week
            </div>
          </div>
          <button className="btn-ghost p-2" onClick={onClose} aria-label="Close review">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ReviewStack
          items={deck}
          roleOf={roleOf}
          showRole={roleId === null}
          onDecide={onDecide}
          onUndo={onUndo}
          canUndo={weekLog.length > 0}
          onContact={setContact}
          paused={Boolean(contact)}
          done={<DoneSummary onClose={onClose} onUndo={weekLog.length > 0 ? onUndo : undefined} />}
        />
      </div>
      {contact && <OutreachModal candidate={contact} role={roleOf(contact.roleId)} onClose={() => setContact(null)} />}
    </div>
  );
}

function DoneSummary({ onClose, onUndo }: { onClose: () => void; onUndo?: () => void }) {
  const { state } = useAppState();
  const week = reviewsThisWeek(state.reviewLog);
  const name = (id: string) => state.candidates.find((c) => c.id === id)?.name ?? 'Unknown';
  const waiting = state.candidates.filter((c) => c.status === 'suggested').length;
  const capHit = week.length >= REVIEW_WEEKLY_CAP;

  return (
    <div className="w-full max-w-sm text-center">
      <PartyPopper className="mx-auto mb-3 h-6 w-6 text-ink-900" />
      <h3 className="text-xl font-semibold text-ink-900">Done for this week</h3>
      {week.length === 0 ? (
        <p className="mt-1 text-sm text-ink-500">Nothing to review yet.</p>
      ) : (
        <DecisionSummary
          rows={week.map((e) => ({
            name: name(e.candidateId),
            decision: e.decision,
            reason: e.reason,
          }))}
        />
      )}
      {capHit && waiting > 0 && <p className="mt-3 text-xs text-ink-400">{waiting} more wait for next week.</p>}
      <div className="mt-6 flex flex-col gap-2">
        <button className="btn-primary w-full" onClick={onClose}>Back to pipeline</button>
        {onUndo && <button className="btn-ghost w-full text-xs" onClick={onUndo}>Undo last</button>}
      </div>
    </div>
  );
}

export function DecisionSummary({
  rows,
}: {
  rows: { name: string; decision: ReviewDecision; reason?: SkipReason }[];
}) {
  const groups: { key: ReviewDecision; label: string; dot: string }[] = [
    { key: 'priority', label: 'Priority', dot: 'bg-amber-400' },
    { key: 'approve', label: 'Approved', dot: 'bg-teal-600' },
    { key: 'skip', label: 'Skipped', dot: 'bg-ink-300' },
  ];
  return (
    <div className="mt-5 space-y-3 text-left text-sm">
      {groups.map((g) => {
        const items = rows.filter((r) => r.decision === g.key);
        return (
          <div key={g.key}>
            <div className="flex items-center gap-2 font-medium text-ink-900">
              <span className={`h-2 w-2 rounded-full ${g.dot}`} /> {g.label}
              <span className="ml-auto tabular-nums text-ink-400">{items.length}</span>
            </div>
            {items.length > 0 && (
              <p className="ml-4 mt-0.5 text-xs text-ink-500">
                {items
                  .map((r) => (r.reason ? `${r.name} (${SKIP_REASONS.find((x) => x.id === r.reason)?.label.toLowerCase()})` : r.name))
                  .join(', ')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
