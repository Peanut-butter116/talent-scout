import { ExternalLink, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AddProfile } from '../components/AddProfile';
import { JdLink } from '../components/JdLink';
import { PageHeader } from '../components/PageHeader';
import { RoleSelector } from '../components/RoleSelector';
import { SearchBuilder } from '../components/SearchBuilder';
import { STATUS_LABEL } from '../lib/pipeline';
import { rankCandidates } from '../lib/scoring';
import { linkedInSearchUrl, SEARCH_VARIANTS } from '../lib/search';
import { useAppState, useSelectedRole } from '../state/AppState';
import { OUTCOME_VALUE } from '../types';

export function SourcingPage() {
  const role = useSelectedRole();

  return (
    <>
      <PageHeader title="Sourcing" subtitle="Find people on LinkedIn, then add the ones you like." actions={<JdLink role={role} />} />
      <RoleSelector />
      <div className="space-y-14">
        <SearchBuilder role={role} />
        <AddProfile role={role} />
        <AddedProfiles />
        <SavedSearches />
      </div>
    </>
  );
}

function AddedProfiles() {
  const { state, dispatch } = useAppState();
  const role = useSelectedRole();
  const [confirm, setConfirm] = useState<string | null>(null);
  const ranked = useMemo(() => rankCandidates(state.candidates, role), [state.candidates, role]);
  const mine = ranked.filter((r) => r.candidate.addedBy === 'you');

  return (
    <section aria-labelledby="added-h">
      <h2 id="added-h" className="mb-3 text-lg font-semibold text-ink-900">Added by you</h2>
      {mine.length === 0 ? (
        <p className="text-sm text-ink-400">No profiles added for this role yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {mine.map((r) => (
            <li key={r.candidate.id} className="flex items-center gap-3 py-3">
              <span className="w-8 text-sm tabular-nums text-ink-400">#{r.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-ink-900">{r.candidate.name}</div>
                <div className="truncate text-sm text-ink-500">
                  {r.candidate.headline} · {STATUS_LABEL[r.candidate.status]}
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-ink-900">{Math.round(r.cautiousFit)}%</span>
              {confirm === r.candidate.id ? (
                <span className="flex items-center gap-1">
                  <button
                    className="btn bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
                    onClick={() => {
                      dispatch({ type: 'DELETE_CANDIDATE', candidateId: r.candidate.id });
                      setConfirm(null);
                    }}
                  >
                    Delete
                  </button>
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setConfirm(null)}>Cancel</button>
                </span>
              ) : (
                <button className="btn-ghost p-2 text-ink-300 hover:text-rose-600" onClick={() => setConfirm(r.candidate.id)} aria-label={`Delete ${r.candidate.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SavedSearches() {
  const { state, dispatch } = useAppState();
  const role = useSelectedRole();
  const searches = state.savedSearches.filter((s) => s.roleId === role.id);
  const progressed = new Set(state.chats.filter((c) => OUTCOME_VALUE[c.outcome] === 1).map((c) => c.candidateId));

  return (
    <section aria-labelledby="saved-h">
      <h2 id="saved-h" className="mb-3 text-lg font-semibold text-ink-900">Saved searches</h2>
      {searches.length === 0 ? (
        <p className="text-sm text-ink-400">None saved yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {searches.map((s) => {
            const people = state.candidates.filter((c) => c.searchId === s.id);
            const stats = [
              ['Added', people.length],
              ['Shortlisted', people.filter((c) => c.status !== 'new').length],
              ['Chats', people.filter((c) => c.status === 'done').length],
              ['Progressed', people.filter((c) => progressed.has(c.id)).length],
            ] as const;
            return (
              <li key={s.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900">
                      {SEARCH_VARIANTS.find((v) => v.id === s.variant)?.label} · {new Date(s.at).toLocaleDateString()}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-ink-400">{s.query}</div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <a href={linkedInSearchUrl(s.query)} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2" aria-label="Open in LinkedIn">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button className="btn-ghost p-2 text-ink-300 hover:text-rose-600" onClick={() => dispatch({ type: 'DELETE_SEARCH', searchId: s.id })} aria-label="Delete saved search">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500">
                  {stats.map(([k, v]) => (
                    <div key={k}>
                      <dt className="inline">{k} </dt>
                      <dd className="inline font-semibold tabular-nums text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
