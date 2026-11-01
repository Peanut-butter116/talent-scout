import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { CriterionAnalysis } from '../lib/analysis';
import { useAppState } from '../state/AppState';
import type { Criterion, Role } from '../types';
import { GlotWideBadge, HypothesisChip } from './Chips';

export function WeightSlider({
  role,
  criterion,
  tourId,
}: {
  role: Role;
  criterion: Criterion;
  tourId?: string;
}) {
  const { dispatch } = useAppState();
  const set = (weight: number) =>
    dispatch({ type: 'SET_WEIGHT', roleId: role.id, criterionId: criterion.id, weight });
  return (
    <div className="flex items-center gap-3" data-tour={tourId}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={criterion.weight}
        onChange={(e) => set(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-teal-600"
        aria-label={`Weight for ${criterion.name}`}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={criterion.weight}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) set(v);
        }}
        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-right text-sm tabular-nums focus:border-teal-500 focus:outline-none"
        aria-label={`Weight value for ${criterion.name}`}
      />
    </div>
  );
}

export function CriterionRow({
  role,
  criterion,
  analysis,
  tourId,
}: {
  role: Role;
  criterion: Criterion;
  analysis?: CriterionAnalysis;
  tourId?: string;
}) {
  const { dispatch } = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(criterion.name);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const save = () => {
    if (draft.trim()) dispatch({ type: 'RENAME_CRITERION', roleId: role.id, criterionId: criterion.id, name: draft });
    else setDraft(criterion.name);
    setEditing(false);
  };

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                className="input py-1.5"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                  if (e.key === 'Escape') {
                    setDraft(criterion.name);
                    setEditing(false);
                  }
                }}
                aria-label="Criterion name"
              />
              <button className="btn-ghost p-1.5" onClick={save} aria-label="Save name">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-navy-900">{criterion.name}</span>
              <button
                className="mt-0.5 text-slate-400 hover:text-navy-700"
                onClick={() => {
                  setDraft(criterion.name);
                  setEditing(true);
                }}
                aria-label={`Rename ${criterion.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {criterion.glotWide && <GlotWideBadge />}
            {analysis && <HypothesisChip label={analysis.label} />}
          </div>
        </div>
        <div className="flex items-center gap-2 md:w-80">
          <div className="flex-1">
            <WeightSlider role={role} criterion={criterion} tourId={tourId} />
          </div>
          {confirmRemove ? (
            <div className="flex items-center gap-1">
              <button
                className="btn bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700"
                onClick={() => dispatch({ type: 'REMOVE_CRITERION', roleId: role.id, criterionId: criterion.id })}
              >
                Remove
              </button>
              <button className="btn-ghost p-1" onClick={() => setConfirmRemove(false)} aria-label="Cancel remove">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600 disabled:hover:text-slate-400"
              onClick={() => setConfirmRemove(true)}
              disabled={role.criteria.length <= 1}
              aria-label={`Remove ${criterion.name}`}
              title="Remove criterion"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
