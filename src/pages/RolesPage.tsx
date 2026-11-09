import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CriterionRow } from '../components/CriterionRow';
import { InfoTip } from '../components/InfoTip';
import { PageHeader } from '../components/PageHeader';
import { RoleSelector } from '../components/RoleSelector';
import { WeightHistory } from '../components/WeightHistory';
import { totalWeight } from '../lib/weights';
import { useAppState, useSelectedRole } from '../state/AppState';
import { useRanked, useRoleAnalysis } from '../state/hooks';
import { rememberIfUnseen } from '../state/rankMemory';

export function RolesPage() {
  const { dispatch } = useAppState();
  const role = useSelectedRole();
  const analysis = useRoleAnalysis(role);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const total = totalWeight(role.criteria);
  const ranked = useRanked(role);

  // Baseline for the "rows that moved" highlight on the Candidates page.
  useEffect(() => {
    rememberIfUnseen(role.id, new Map(ranked.map((r) => [r.candidate.id, r.rank])));
    // Only on first view of each role, before any edits here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.id]);

  const add = () => {
    if (!newName.trim()) return;
    dispatch({ type: 'ADD_CRITERION', roleId: role.id, name: newName });
    setNewName('');
  };

  return (
    <>
      <PageHeader
        title="Roles & Criteria"
        subtitle="Each criterion is a bet on what predicts a great hire."
        actions={
          !creating && (
            <button className="btn-secondary" onClick={() => setCreating(true)} data-tour="new-role">
              <Plus className="h-4 w-4" /> New role
            </button>
          )
        }
      />
      {creating && (
        <form
          className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl bg-ink-50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!roleName.trim()) return;
            dispatch({ type: 'ADD_ROLE', title: roleName });
            setRoleName('');
            setCreating(false);
          }}
        >
          <input
            className="input min-w-0 flex-1"
            placeholder="Role name, e.g. Product Designer"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            aria-label="New role name"
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={!roleName.trim()}>
            Create
          </button>
          <button className="btn-ghost p-2" type="button" onClick={() => setCreating(false)} aria-label="Cancel new role">
            <X className="h-4 w-4" />
          </button>
          <p className="w-full text-xs text-ink-400">Starts with the three company-wide qualities. Add your own criteria next.</p>
        </form>
      )}
      <RoleSelector />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="min-w-0 space-y-12 lg:col-span-2">
          <section>
            <p className="text-lg text-ink-700">{role.summary}</p>
            {role.custom && (
              <div className="mt-2">
                {confirmDelete ? (
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-ink-600">Delete this role?</span>
                    <button
                      className="btn bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
                      onClick={() => {
                        dispatch({ type: 'DELETE_ROLE', roleId: role.id });
                        setConfirmDelete(false);
                      }}
                    >
                      Delete
                    </button>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setConfirmDelete(false)}>Cancel</button>
                  </span>
                ) : (
                  <button className="btn-ghost -ml-3 text-sm text-ink-500 hover:text-rose-600" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4" /> Delete role
                  </button>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="criteria-h">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="criteria-h" className="flex items-center gap-1.5 text-lg font-semibold text-ink-900">
                Criteria
                <InfoTip label="About weights">
                  Weights always total 100. Move one and the others rebalance. The chip shows what coffee chats say about
                  each criterion so far.
                </InfoTip>
              </h2>
              <span className={`text-sm tabular-nums ${total === 100 ? 'text-ink-400' : 'text-rose-600'}`}>{total} / 100</span>
            </div>
            <ul className="divide-y divide-ink-100">
              {role.criteria.map((c, i) => (
                <CriterionRow
                  key={c.id}
                  role={role}
                  criterion={c}
                  analysis={analysis.find((a) => a.criterion.id === c.id)}
                  tourId={i === 0 ? 'first-weight' : undefined}
                />
              ))}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input
                className="input"
                placeholder="New criterion"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                aria-label="New criterion name"
              />
              <button className="btn-secondary shrink-0" type="submit" disabled={!newName.trim()}>
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>
          </section>

          <section aria-labelledby="musthave-h">
            <h2 id="musthave-h" className="mb-3 flex items-center gap-1.5 text-lg font-semibold text-ink-900">
              Must-haves
              <InfoTip label="About must-haves">
                Yes / No / Unknown. Unknown never excludes anyone — check at the first call. Only an explicit No flags a
                candidate.
              </InfoTip>
            </h2>
            {role.mustHaves.length === 0 ? (
              <p className="text-sm text-ink-400">None for this role.</p>
            ) : (
              <ul className="space-y-2">
                {role.mustHaves.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-800">{m.label}</span>
                    <Toggle
                      checked={m.enabled}
                      label={m.label}
                      onChange={() => dispatch({ type: 'TOGGLE_MUST_HAVE', roleId: role.id, mustHaveId: m.id })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 lg:col-span-1">
          <WeightHistory />
        </div>
      </div>
    </>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={`${label} ${checked ? 'on' : 'off'}`}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-accent-700' : 'bg-ink-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
