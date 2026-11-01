import { Check, PartyPopper, RotateCcw, RotateCw, Star, X } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { biggestUncertainty, REVIEW_WEEKLY_CAP, reviewDeck, reviewsThisWeek } from '../lib/pipeline';
import { strongestEvidence, type RankedCandidate } from '../lib/scoring';
import { useAppState } from '../state/AppState';
import { SKIP_REASONS, type ReviewDecision, type Role, type SkipReason } from '../types';
import { ConfidenceChip, StrengthChip } from './Chips';
import { OutreachModal } from './OutreachModal';
import { ProfileActions } from './ProfileActions';
import { FitBar, RatingDots } from './FitBar';

const SWIPE_X = 110;
const SWIPE_UP = 110;
const FLY_MS = 220;

interface CardHandle {
  fly: (d: ReviewDecision) => void;
}

export function QuickReview({ roleId, onClose }: { roleId: string | null; onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const [frontId, setFrontId] = useState<string | null>(null);
  const [askReasonFor, setAskReasonFor] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [contactId, setContactId] = useState<string | null>(null);
  const cardRef = useRef<CardHandle>(null);

  const deck = useMemo(() => {
    const d = reviewDeck(state.candidates, state.roles, roleId, state.reviewLog);
    if (frontId) {
      const i = d.findIndex((r) => r.candidate.id === frontId);
      if (i > 0) d.unshift(...d.splice(i, 1));
    }
    return d;
  }, [state.candidates, state.roles, roleId, state.reviewLog, frontId]);

  const weekLog = reviewsThisWeek(state.reviewLog);
  const current = askReasonFor ? null : deck[0];
  const roleOf = (id: string) => state.roles.find((r) => r.id === id)!;

  const commit = useCallback(
    (candidateId: string, decision: ReviewDecision, reason?: SkipReason) => {
      dispatch({ type: 'REVIEW_DECISION', candidateId, decision, reason });
      setSessionCount((n) => n + 1);
      setFlipped(false);
      setFrontId(null);
      setCardKey((k) => k + 1);
    },
    [dispatch],
  );

  const onDecide = useCallback(
    (d: ReviewDecision) => {
      if (!current) return;
      if (d === 'skip') setAskReasonFor(current.candidate.id);
      else commit(current.candidate.id, d);
    },
    [current, commit],
  );

  const cancelSkip = () => {
    setFrontId(askReasonFor);
    setAskReasonFor(null);
    setCardKey((k) => k + 1);
  };

  const undo = useCallback(() => {
    const last = state.reviewLog[state.reviewLog.length - 1];
    if (!last) return;
    dispatch({ type: 'UNDO_REVIEW' });
    setAskReasonFor(null);
    setFrontId(last.candidateId);
    setSessionCount((n) => Math.max(0, n - 1));
    setFlipped(false);
    setCardKey((k) => k + 1);
  }, [dispatch, state.reviewLog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (contactId || (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)))) return;
      if (e.key === 'Escape') {
        if (askReasonFor) cancelSkip();
        else onClose();
        return;
      }
      if (askReasonFor) {
        const n = Number(e.key);
        if (n >= 1 && n <= SKIP_REASONS.length) commit(askReasonFor, 'skip', SKIP_REASONS[n - 1].id);
        setAskReasonFor((id) => (n >= 1 && n <= SKIP_REASONS.length ? null : id));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') return undo();
      if (e.key.toLowerCase() === 'u') return undo();
      if (!current) return;
      if (e.key === 'ArrowRight') cardRef.current?.fly('approve');
      else if (e.key === 'ArrowLeft') cardRef.current?.fly('skip');
      else if (e.key === 'ArrowUp') cardRef.current?.fly('priority');
      else if (e.key === ' ' || e.key === 'Enter') setFlipped((f) => !f);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askReasonFor, current, undo, onClose, commit, contactId]);

  const total = sessionCount + deck.length + (askReasonFor ? 1 : 0);
  const position = Math.min(total, sessionCount + 1);
  const capLeft = Math.max(0, REVIEW_WEEKLY_CAP - weekLog.length);
  const done = !current && !askReasonFor;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-navy-950/60 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Quick review">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-slate-50 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <div className="text-sm font-semibold text-navy-900">Quick review</div>
            <div className="text-xs text-slate-500">
              {done ? 'All done' : `Card ${position} of ${total}`} · {capLeft} of {REVIEW_WEEKLY_CAP} left this week
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost px-2 py-1.5 text-xs" onClick={undo} disabled={state.reviewLog.length === 0 || weekLog.length === 0} aria-label="Undo last decision">
              <RotateCcw className="h-4 w-4" /> Undo
            </button>
            <button className="btn-ghost p-2" onClick={onClose} aria-label="Close quick review">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-6" style={{ minHeight: 480 }}>
          {askReasonFor && (
            <SkipReasonPicker
              name={state.candidates.find((c) => c.id === askReasonFor)?.name ?? ''}
              onPick={(r) => {
                commit(askReasonFor, 'skip', r);
                setAskReasonFor(null);
              }}
              onCancel={cancelSkip}
            />
          )}
          {current && (
            <>
              {deck[1] && <div className="absolute inset-x-9 top-9 bottom-8 rounded-2xl border border-slate-200 bg-white/70 shadow-sm" aria-hidden />}
              <SwipeCard
                key={`${current.candidate.id}-${cardKey}`}
                ref={cardRef}
                item={current}
                role={roleOf(current.candidate.roleId)}
                showRole={roleId === null}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
                onDecide={onDecide}
                onContact={() => setContactId(current.candidate.id)}
              />
            </>
          )}
          {done && <DoneSummary onClose={onClose} />}
        </div>
        {contactId && (() => {
          const cand = state.candidates.find((c) => c.id === contactId);
          return cand ? (
            <OutreachModal candidate={cand} role={roleOf(cand.roleId)} onClose={() => setContactId(null)} />
          ) : null;
        })()}

        {current && (
          <div className="border-t border-slate-200 bg-white px-5 pt-4 pb-5">
            <div className="flex items-center justify-center gap-5">
              <RoundButton label="Skip" onClick={() => cardRef.current?.fly('skip')} className="border-rose-200 text-rose-600 hover:bg-rose-50">
                <X className="h-6 w-6" />
              </RoundButton>
              <RoundButton label="Priority" onClick={() => cardRef.current?.fly('priority')} className="h-12 w-12 border-amber-200 text-amber-500 hover:bg-amber-50" small>
                <Star className="h-5 w-5" />
              </RoundButton>
              <RoundButton label="Approve" onClick={() => cardRef.current?.fly('approve')} className="border-teal-200 text-teal-600 hover:bg-teal-50">
                <Check className="h-6 w-6" />
              </RoundButton>
            </div>
            <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">
              Keys: ← skip · → approve · ↑ priority · space flip · U undo
            </p>
            <p className="mt-3 text-center text-xs text-slate-400 sm:hidden">Swipe right to approve, left to skip, up for priority.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoundButton({
  label,
  onClick,
  className,
  children,
  small,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex ${small ? '' : 'h-14 w-14'} items-center justify-center rounded-full border-2 bg-white shadow-sm transition-transform active:scale-95 ${className}`}
      >
        {children}
      </button>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

const SwipeCard = forwardRef<
  CardHandle,
  {
    item: RankedCandidate;
    role: Role;
    showRole: boolean;
    flipped: boolean;
    onFlip: () => void;
    onDecide: (d: ReviewDecision) => void;
    onContact: () => void;
  }
>(function SwipeCard({ item, role, showRole, flipped, onFlip, onDecide, onContact }, ref) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<ReviewDecision | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);

  const fly = useCallback(
    (d: ReviewDecision) => {
      if (exit) return;
      setExit(d);
      window.setTimeout(() => onDecide(d), FLY_MS);
    },
    [exit, onDecide],
  );
  useImperativeHandle(ref, () => ({ fly }), [fly]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (exit || (e.target as HTMLElement).closest('[data-no-drag]')) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!start.current || start.current.id !== e.pointerId) return;
    const x = e.clientX - start.current.x;
    const y = e.clientY - start.current.y;
    if (Math.abs(x) + Math.abs(y) > 6) moved.current = true;
    setPos({ x, y: Math.min(y, 40) });
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    if (!start.current || start.current.id !== e.pointerId) return;
    start.current = null;
    setDragging(false);
    const { x, y } = pos;
    if (!moved.current) {
      setPos({ x: 0, y: 0 });
      onFlip();
      return;
    }
    if (x > SWIPE_X) fly('approve');
    else if (x < -SWIPE_X) fly('skip');
    else if (y < -SWIPE_UP && Math.abs(x) < SWIPE_X) fly('priority');
    else setPos({ x: 0, y: 0 });
  };

  let transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.x / 18}deg)`;
  if (exit === 'approve') transform = `translate(140%, ${pos.y}px) rotate(18deg)`;
  if (exit === 'skip') transform = `translate(-140%, ${pos.y}px) rotate(-18deg)`;
  if (exit === 'priority') transform = `translate(${pos.x}px, -140%)`;

  const hint: ReviewDecision | null =
    exit ?? (pos.x > 40 ? 'approve' : pos.x < -40 ? 'skip' : pos.y < -40 ? 'priority' : null);
  const hintStrength = exit ? 1 : Math.min(1, Math.max(Math.abs(pos.x), -pos.y) / SWIPE_X);

  const { candidate: c, score } = item;
  const top = strongestEvidence(c, role, 3);
  const uncertainty = biggestUncertainty(c, role);

  return (
    <div
      className="relative w-full max-w-sm cursor-grab touch-none select-none active:cursor-grabbing"
      style={{
        transform,
        transition: dragging ? 'none' : `transform ${FLY_MS}ms ease-out, opacity ${FLY_MS}ms`,
        opacity: exit ? 0 : 1,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        setDragging(false);
        setPos({ x: 0, y: 0 });
      }}
      data-testid="review-card"
    >
      <div className="relative min-h-[400px] rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        {hint && (
          <div
            className={`pointer-events-none absolute top-5 z-10 rounded-lg border-2 px-3 py-1 text-sm font-bold uppercase tracking-wider ${
              hint === 'approve'
                ? 'right-5 rotate-6 border-teal-500 text-teal-600'
                : hint === 'skip'
                  ? 'left-5 -rotate-6 border-rose-500 text-rose-600'
                  : 'left-1/2 -translate-x-1/2 border-amber-500 text-amber-600'
            }`}
            style={{ opacity: hintStrength }}
          >
            {hint === 'approve' ? 'Approve' : hint === 'skip' ? 'Skip' : 'Priority'}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {showRole && <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-teal-700">{role.title}</div>}
            <h3 className="text-xl font-semibold text-navy-900">{c.name}</h3>
            <p className="text-sm text-slate-600">{c.headline}</p>
            <p className="text-xs text-slate-500">{c.employer} · {c.source}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-50 px-3 py-2.5">
          <FitBar fit={score.fit} />
          <ConfidenceChip confidence={score.confidence} />
          <span className="ml-auto text-xs text-slate-500">{Math.round(score.coverage)}% evidenced</span>
        </div>

        {!flipped ? (
          <>
            <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Top evidence</h4>
            {top.length === 0 ? (
              <p className="text-sm italic text-slate-400">No evidence yet.</p>
            ) : (
              <ul className="space-y-2">
                {top.map(({ criterion, evidence }) => (
                  <li key={criterion.id} className="flex gap-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${evidence.strength === 'strong' ? 'bg-teal-500' : 'bg-amber-400'}`} />
                    <span className="text-slate-700">{evidence.note}</span>
                  </li>
                ))}
              </ul>
            )}
            {item.needsMoreEvidence && (
              <div className="mt-4 rounded-lg border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <span className="font-medium">Needs more evidence</span> — find out more before contacting.
              </div>
            )}
            {uncertainty && (
              <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span className="font-medium">Biggest uncertainty: </span>
                {uncertainty}
              </div>
            )}
          </>
        ) : (
          <>
            <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Full evidence</h4>
            <ul className="max-h-[230px] space-y-2.5 overflow-y-auto pr-1" data-no-drag>
              {role.criteria.map((cr) => {
                const e = c.evidence[cr.id];
                return (
                  <li key={cr.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-navy-900">{cr.name}</span>
                      <StrengthChip strength={e ? e.strength : 'missing'} />
                    </div>
                    {e ? (
                      <div className="mt-0.5 flex items-center gap-2 text-slate-600">
                        <RatingDots rating={e.rating} /> <span>{e.note}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 italic text-slate-400">No evidence yet</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <ProfileActions candidate={c} onContact={onContact} size="sm" />
            </div>
          </>
        )}
        <button
          className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-navy-700"
          onClick={onFlip}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RotateCw className="h-3.5 w-3.5" /> {flipped ? 'Back to summary' : 'Tap card for full evidence'}
        </button>
      </div>
    </div>
  );
});

function SkipReasonPicker({
  name,
  onPick,
  onCancel,
}: {
  name: string;
  onPick: (r: SkipReason) => void;
  onCancel: () => void;
}) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
      <p className="text-sm font-semibold text-navy-900">Why skip {name.split(' ')[0]}?</p>
      <p className="mt-0.5 text-xs text-slate-500">One tap. Reasons feed the rubric on the Learning page.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SKIP_REASONS.map((r, i) => (
          <button key={r.id} className="btn-secondary justify-start text-left" onClick={() => onPick(r.id)}>
            <span className="hidden text-xs text-slate-400 sm:inline">{i + 1}</span> {r.label}
          </button>
        ))}
      </div>
      <button className="btn-ghost mt-3 w-full text-xs" onClick={onCancel}>
        Cancel — keep this card
      </button>
    </div>
  );
}

function DoneSummary({ onClose }: { onClose: () => void }) {
  const { state } = useAppState();
  const week = reviewsThisWeek(state.reviewLog);
  const name = (id: string) => state.candidates.find((c) => c.id === id)?.name ?? 'Unknown';
  const approved = week.filter((e) => e.decision === 'approve');
  const priority = week.filter((e) => e.decision === 'priority');
  const skipped = week.filter((e) => e.decision === 'skip');
  const waiting = state.candidates.filter((c) => c.status === 'suggested').length;
  const capHit = week.length >= REVIEW_WEEKLY_CAP;

  return (
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <PartyPopper className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-navy-900">Done for this week</h3>
      <p className="mt-1 text-sm text-slate-500">
        {week.length === 0
          ? 'Nothing to review — generate this week’s shortlist first.'
          : `You reviewed ${week.length} ${week.length === 1 ? 'candidate' : 'candidates'}. Outreach and booking happen next.`}
      </p>
      {week.length > 0 && (
        <div className="mt-5 space-y-2 text-left text-sm">
          <SummaryRow label="Priority — CEO meets personally" tone="amber" names={priority.map((e) => name(e.candidateId))} />
          <SummaryRow label="Approved" tone="teal" names={approved.map((e) => name(e.candidateId))} />
          <SummaryRow
            label="Skipped"
            tone="slate"
            names={skipped.map((e) => `${name(e.candidateId)}${e.reason ? ` (${SKIP_REASONS.find((r) => r.id === e.reason)?.label.toLowerCase()})` : ''}`)}
          />
        </div>
      )}
      {capHit && waiting > 0 && (
        <p className="mt-4 text-xs text-slate-500">
          {waiting} more suggested {waiting === 1 ? 'candidate waits' : 'candidates wait'} for next week (weekly cap of {REVIEW_WEEKLY_CAP}).
        </p>
      )}
      <button className="btn-primary mt-6 w-full" onClick={onClose}>
        Back to pipeline
      </button>
    </div>
  );
}

function SummaryRow({ label, names, tone }: { label: string; names: string[]; tone: 'teal' | 'amber' | 'slate' }) {
  const dot = tone === 'teal' ? 'bg-teal-500' : tone === 'amber' ? 'bg-amber-400' : 'bg-slate-400';
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2 font-medium text-navy-900">
        <span className={`h-2 w-2 rounded-full ${dot}`} /> {label}
        <span className="ml-auto tabular-nums text-slate-500">{names.length}</span>
      </div>
      {names.length > 0 && <p className="mt-1 text-xs text-slate-500">{names.join(', ')}</p>}
    </div>
  );
}
