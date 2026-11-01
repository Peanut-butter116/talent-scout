import { Check } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '../state/AppState';
import { OUTCOME_LABEL, type Candidate, type ChatFeedback, type ChatOutcome, type Role } from '../types';
import { SidePanel } from './SidePanel';

const OUTCOMES: { id: ChatOutcome; cls: string }[] = [
  { id: 'progress', cls: 'bg-teal-700 text-white' },
  { id: 'maybe', cls: 'bg-amber-400 text-ink-900' },
  { id: 'not_fit', cls: 'bg-rose-600 text-white' },
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
          <h2 className="text-xl font-semibold text-ink-900">Chat with {candidate.name}</h2>
          <p className="text-sm text-ink-500">{role.title}</p>
        </>
      }
      footer={
        <button className="btn-primary w-full" onClick={save} disabled={!outcome} data-tour="save-feedback">
          <Check className="h-4 w-4" /> {existing ? 'Update' : 'Save'}
        </button>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-900">Outcome</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Outcome">
          {OUTCOMES.map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={outcome === o.id}
              onClick={() => setOutcome(o.id)}
              className={`rounded-full px-2 py-2.5 text-center text-sm font-medium transition-colors ${
                outcome === o.id ? o.cls : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {OUTCOME_LABEL[o.id]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold text-ink-900">
          What you saw <span className="font-normal text-ink-400">· optional</span>
        </legend>
        <ul className="space-y-3">
          {role.criteria.map((c) => {
            const profile = candidate.evidence[c.id];
            const v = observed[c.id];
            return (
              <li key={c.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm text-ink-800">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-ink-400">{profile ? `profile ${profile.rating}` : ''}</span>
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
        <span className="mb-1 block text-sm font-semibold text-ink-900">
          Note <span className="font-normal text-ink-400">· optional</span>
        </span>
        <input
          className="input"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="One line"
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
      className={`${wide ? 'px-2.5' : 'w-9'} h-8 rounded-full text-xs font-medium tabular-nums transition-colors ${
        active ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
      }`}
    >
      {children}
    </button>
  );
}
