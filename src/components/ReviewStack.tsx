import { Check, RotateCcw, RotateCw, Star, X } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { biggestUncertainty } from '../lib/pipeline';
import { strongestEvidence, type RankedCandidate } from '../lib/scoring';
import { SKIP_REASONS, type Candidate, type ReviewDecision, type Role, type SkipReason } from '../types';
import { ConfidenceChip, StrengthChip } from './Chips';
import { RatingDots } from './FitBar';
import { ProfileActions } from './ProfileActions';

const SWIPE_X = 110;
const SWIPE_UP = 110;
const FLY_MS = 220;

interface CardHandle {
  fly: (d: ReviewDecision) => void;
}

/**
 * The swipe card stack, shared by the in-app Quick review and the standalone /review page.
 * `items[0]` is the current card. The parent owns the decisions; this owns the gestures.
 */
export function ReviewStack({
  items,
  roleOf,
  showRole,
  onDecide,
  onUndo,
  canUndo,
  onContact,
  done,
  paused = false,
}: {
  items: RankedCandidate[];
  roleOf: (roleId: string) => Role;
  showRole: boolean;
  onDecide: (candidateId: string, decision: ReviewDecision, reason?: SkipReason) => void;
  onUndo: () => void;
  canUndo: boolean;
  onContact?: (c: Candidate) => void;
  done: ReactNode;
  /** Ignore keyboard shortcuts (e.g. while a dialog is open on top). */
  paused?: boolean;
}) {
  const [askReasonFor, setAskReasonFor] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const cardRef = useRef<CardHandle>(null);
  const current = askReasonFor ? null : items[0];

  const commit = useCallback(
    (id: string, d: ReviewDecision, reason?: SkipReason) => {
      onDecide(id, d, reason);
      setAskReasonFor(null);
      setFlipped(false);
      setCardKey((k) => k + 1);
    },
    [onDecide],
  );

  const onCardDecide = useCallback(
    (d: ReviewDecision) => {
      if (!current) return;
      if (d === 'skip') setAskReasonFor(current.candidate.id);
      else commit(current.candidate.id, d);
    },
    [current, commit],
  );

  const cancelSkip = useCallback(() => {
    setAskReasonFor(null);
    setCardKey((k) => k + 1);
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return;
    onUndo();
    setAskReasonFor(null);
    setFlipped(false);
    setCardKey((k) => k + 1);
  }, [canUndo, onUndo]);

  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (askReasonFor) {
        const n = Number(e.key);
        if (n >= 1 && n <= SKIP_REASONS.length) commit(askReasonFor, 'skip', SKIP_REASONS[n - 1].id);
        else if (e.key === 'Escape') cancelSkip();
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
  }, [askReasonFor, current, undo, commit, cancelSkip, paused]);

  const pending = askReasonFor ? items.find((r) => r.candidate.id === askReasonFor) : null;

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="relative flex flex-1 flex-col items-center justify-center px-1 py-4" style={{ minHeight: 440 }}>
        {pending && (
          <SkipReasonPicker
            name={pending.candidate.name}
            onPick={(r) => commit(pending.candidate.id, 'skip', r)}
            onCancel={cancelSkip}
          />
        )}
        {current && (
          <>
            {items[1] && <div className="absolute inset-x-6 top-6 bottom-2 rounded-3xl bg-ink-100" aria-hidden />}
            <SwipeCard
              key={`${current.candidate.id}-${cardKey}`}
              ref={cardRef}
              item={current}
              role={roleOf(current.candidate.roleId)}
              showRole={showRole}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              onDecide={onCardDecide}
              onContact={onContact ? () => onContact(current.candidate) : undefined}
            />
          </>
        )}
        {!current && !pending && done}
      </div>

      {current && (
        <div className="pb-2 pt-3">
          <div className="flex items-end justify-center gap-6">
            <RoundButton label="Skip" onClick={() => cardRef.current?.fly('skip')} className="text-rose-600">
              <X className="h-6 w-6" />
            </RoundButton>
            <RoundButton label="Priority" onClick={() => cardRef.current?.fly('priority')} className="h-12 w-12 text-amber-500" small>
              <Star className="h-5 w-5" />
            </RoundButton>
            <RoundButton label="Approve" onClick={() => cardRef.current?.fly('approve')} className="text-ink-900">
              <Check className="h-6 w-6" />
            </RoundButton>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-ink-400">
            <button className="btn-ghost px-2 py-1 text-xs" onClick={undo} disabled={!canUndo} aria-label="Undo last decision">
              <RotateCcw className="h-3.5 w-3.5" /> Undo
            </button>
            <span className="hidden sm:inline">← skip · → approve · ↑ priority</span>
          </div>
        </div>
      )}
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
  children: ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex ${small ? '' : 'h-14 w-14'} items-center justify-center rounded-full bg-white shadow-md ring-1 ring-ink-100 transition-transform active:scale-95 ${className}`}
      >
        {children}
      </button>
      <span className="text-[11px] text-ink-500">{label}</span>
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
    onContact?: () => void;
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
  const unknown = biggestUncertainty(c, role);

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
      <div className="relative min-h-[420px] rounded-3xl bg-white p-6 shadow-xl ring-1 ring-ink-100">
        {hint && (
          <div
            className={`pointer-events-none absolute top-5 z-10 rounded-full px-3 py-1 text-sm font-semibold ${
              hint === 'approve'
                ? 'right-5 bg-ink-900 text-white'
                : hint === 'skip'
                  ? 'left-5 bg-rose-600 text-white'
                  : 'left-1/2 -translate-x-1/2 bg-amber-400 text-ink-900'
            }`}
            style={{ opacity: hintStrength }}
          >
            {hint === 'approve' ? 'Approve' : hint === 'skip' ? 'Skip' : 'Priority'}
          </div>
        )}

        {showRole && <div className="mb-1 text-xs font-medium text-ink-500">{role.title}</div>}
        <h3 className="text-2xl font-semibold text-ink-900">{c.name}</h3>
        <p className="text-[15px] text-ink-500">{c.headline}</p>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums text-ink-900">{Math.round(item.cautiousFit)}%</span>
          <span className="text-xs text-ink-400">fit</span>
          <span className="ml-auto"><ConfidenceChip confidence={score.confidence} /></span>
        </div>

        {!flipped ? (
          <>
            <ul className="mt-4 space-y-2">
              {top.length === 0 && <li className="text-sm text-ink-400">No evidence yet.</li>}
              {top.map(({ criterion, evidence }) => (
                <li key={criterion.id} className="flex gap-2 text-sm text-ink-700">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${evidence.strength === 'strong' ? 'bg-teal-600' : 'bg-amber-400'}`} />
                  {evidence.note}
                </li>
              ))}
            </ul>
            {unknown && (
              <p className="mt-4 text-sm text-ink-500">
                <span className="font-medium text-ink-700">Biggest unknown: </span>
                {unknown.replace(/^No evidence yet for |^Only weak evidence for /, '')}
              </p>
            )}
          </>
        ) : (
          <>
            <ul className="mt-4 max-h-[210px] space-y-2.5 overflow-y-auto pr-1" data-no-drag>
              {role.criteria.map((cr) => {
                const e = c.evidence[cr.id];
                return (
                  <li key={cr.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink-900">{cr.name}</span>
                      <StrengthChip strength={e ? e.strength : 'missing'} />
                    </div>
                    {e && (
                      <div className="mt-0.5 flex items-center gap-2 text-ink-500">
                        <RatingDots rating={e.rating} /> <span>{e.note}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {onContact && (
              <div className="mt-3">
                <ProfileActions candidate={c} onContact={onContact} size="sm" />
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex items-center justify-between gap-3" data-no-drag>
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-700"
            onClick={onFlip}
          >
            <RotateCw className="h-3.5 w-3.5" /> {flipped ? 'Summary' : 'Full evidence'}
          </button>

        </div>
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
    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl ring-1 ring-ink-100">
      <p className="font-semibold text-ink-900">Why skip {name.split(' ')[0]}?</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SKIP_REASONS.map((r) => (
          <button key={r.id} className="btn-secondary justify-center" onClick={() => onPick(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <button className="btn-ghost mt-3 w-full text-xs" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
