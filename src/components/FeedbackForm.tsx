import { Check } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '../state/AppState';
import { OUTCOME_LABEL, type Candidate, type ChatFeedback, type ChatOutcome, type Role } from '../types';
import { SidePanel } from './SidePanel';

const OUTCOMES: { id: ChatOutcome; hint: string; cls: string }[] = [
  { id: 'progress', hint: 'Move to formal process', cls: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { id: 'maybe', hint: 'Not sure yet', cls: 'border-amber-300 bg-amber-50 text-amber-800' },
  { id: 'not_fit', hint: 'Thank and close', cls: 'border-rose-300 bg-rose-50 text-rose-800' },
];

/** Quick coffee-chat feedback: outcome, optional observed ratings, short note. */
export function FeedbackForm({
  candidate,
  role,
  existing,
  onClose,
  onSaved,
}: {
  candidate: Candidate;
  role: Role;
  existing?: ChatFeedback;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const { dispatch } = useAppState();
  const [outcome, setOutcome] = useState<ChatOutcome | null>(existing?.outcome ?? null);
  const [observed, setObserved] = useState<Record<string, number | undefined>>(existing?.observed ?? {});
  const [note, setNote] = useState(existing?.note ?? '');

  const save = () => {
    if (!outcome) return;
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(observed)) if (v !== undefined) clean[k] = v;
    dispatch({
      type: 'LOG_CHAT',
      chat: {
        id: existing?.id ?? `chat-${candidate.id}-${Date.now().toString(36)}`,
        candidateId: candidate.id,
        roleId: candidate.roleId,
        outcome,
        observed: clean,
        note: note.trim(),
        at: new Date().toISOString(),
      },
    });
    onSaved(candidate.name);
    onClose();
  };

  return (
    <SidePanel
      open
      onClose={onClose}
      title={
        <>
          <h2 className="text-lg font-semibold text-navy-900">Coffee chat with {candidate.name}</h2>
          <p className="text-sm text-slate-500">{role.title} · about 30 seconds</p>
        </>
      }
      footer={
        <button className="btn-teal w-full" onClick={save} disabled={!outcome} data-tour="save-feedback">
          <Check className="h-4 w-4" /> {existing ? 'Update feedback' : 'Save feedback'}
        </button>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy-900">1. Outcome</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Outcome">
          {OUTCOMES.map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={outcome === o.id}
              onClick={() => setOutcome(o.id)}
              className={`rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                outcome === o.id ? o.cls : 'border-slate-200 bg-white text-navy-800 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-semibold">{OUTCOME_LABEL[o.id]}</div>
              <div className="mt-0.5 text-[11px] opacity-70">{o.hint}</div>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-1 text-sm font-semibold text-navy-900">2. What did you see? (optional)</legend>
        <p className="mb-3 text-xs text-slate-500">Rate only what came up. Skipped criteria don't count either way.</p>
        <ul className="space-y-3">
          {role.criteria.map((c) => {
            const profile = candidate.evidence[c.id];
            const v = observed[c.id];
            return (
              <li key={c.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm text-navy-900">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {profile ? `profile ${profile.rating}/5` : 'no profile evidence'}
                  </span>
                </div>
                <div className="flex gap-1" role="radiogroup" aria-label={`Observed rating for ${c.name}`}>
                  <RatingBtn active={v === undefined} onClick={() => setObserved((o) => ({ ...o, [c.id]: undefined }))} wide>
                    Skip
                  </RatingBtn>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <RatingBtn key={n} active={v === n} onClick={() => setObserved((o) => ({ ...o, [c.id]: n }))}>
                      {n}
                    </RatingBtn>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className="mt-6 block">
        <span className="mb-1 block text-sm font-semibold text-navy-900">3. One-line note (optional)</span>
        <input
          className="input"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Walked through a system they built end to end"
        />
      </label>
    </SidePanel>
  );
}

function RatingBtn({
  active,
  onClick,
  children,
  wide,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`${wide ? 'px-2.5' : 'w-9'} h-8 rounded-md border text-xs font-medium tabular-nums transition-colors ${
        active ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-300 bg-white text-navy-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}
