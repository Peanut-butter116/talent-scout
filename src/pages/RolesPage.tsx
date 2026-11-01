import { ArrowRight, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CriterionRow } from '../components/CriterionRow';
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
        subtitle="Every criterion is a hypothesis: “this predicts a strong hire”. Weights always total 100 — move one and the others rebalance proportionally."
        actions={
          <Link to="/candidates" className="btn-secondary">
            See ranking <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <RoleSelector />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-navy-900">{role.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{role.summary}</p>
            <p className="mt-2 text-xs text-slate-400">Paraphrased from Glot's public job ad.</p>
          </section>

          <section className="card p-5" aria-labelledby="criteria-h">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="criteria-h" className="font-semibold text-navy-900">Weighted criteria</h2>
              <span
                className={`chip tabular-nums ${total === 100 ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}
              >
                Total {total} / 100
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
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
              className="mt-5 flex gap-2 border-t border-slate-100 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input
                className="input"
                placeholder="Add a criterion, e.g. “Has shipped a multilingual product”"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                aria-label="New criterion name"
              />
              <button className="btn-primary shrink-0" type="submit" disabled={!newName.trim()}>
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              New criteria start at 10 and have no evidence yet, so they don't change anyone's fit — only their coverage.
            </p>
          </section>

          <section className="card p-5" aria-labelledby="musthave-h">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" aria-hidden />
              <h2 id="musthave-h" className="font-semibold text-navy-900">Must-have checks</h2>
            </div>
            {role.mustHaves.length === 0 ? (
              <p className="text-sm text-slate-500">No must-have checks for this role.</p>
            ) : (
              <ul className="space-y-2">
                {role.mustHaves.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-navy-900">{m.label}</span>
                    <Toggle
                      checked={m.enabled}
                      label={m.label}
                      onChange={() => dispatch({ type: 'TOGGLE_MUST_HAVE', roleId: role.id, mustHaveId: m.id })}
                    />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Answers are Yes / No / Unknown. Unknown never excludes anyone — it shows “Check at first call”. Only an explicit No flags a candidate.
            </p>
          </section>
        </div>

        <div className="lg:col-span-1">
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
        checked ? 'bg-teal-600' : 'bg-slate-300'
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
