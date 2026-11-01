import { ArrowDown, ArrowUp, ChevronDown, SearchX, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CandidatePanel } from '../components/CandidatePanel';
import { ConfidenceChip, FlagChip, StatusChip } from '../components/Chips';
import { WeightSlider } from '../components/CriterionRow';
import { EmptyState } from '../components/EmptyState';
import { FitBar } from '../components/FitBar';
import { PageHeader } from '../components/PageHeader';
import { RoleSelector } from '../components/RoleSelector';
import type { Confidence, SortMode } from '../lib/scoring';
import { HowCalculated } from '../components/HowCalculated';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { JdLink } from '../components/JdLink';
import { ProfileLink } from '../components/ProfileActions';
import { useSelectedRole } from '../state/AppState';
import { useRanked } from '../state/hooks';
import { diffRanks } from '../state/rankMemory';
import { SOURCE_CHANNELS, type SourceChannel } from '../types';

type Flash = { moved: Record<string, number>; tick: number };

export function CandidatesPage() {
  const role = useSelectedRole();
  const [sort, setSort] = useState<SortMode>('cautious');
  const ranked = useRanked(role, sort);
  const [minFit, setMinFit] = useState(0);
  const [confidence, setConfidence] = useState<Confidence | 'all'>('all');
  const [source, setSource] = useState<SourceChannel | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWeights, setShowWeights] = useState(false);
  const [flash, setFlash] = useState<Flash>({ moved: {}, tick: 0 });

  useEffect(() => {
    const moved = diffRanks(role.id, new Map(ranked.map((r) => [r.candidate.id, r.rank])));
    if (Object.keys(moved).length) setFlash((f) => ({ moved, tick: f.tick + 1 }));
  }, [ranked, role.id]);

  useEffect(() => {
    if (!Object.keys(flash.moved).length) return;
    const t = setTimeout(() => setFlash((f) => ({ ...f, moved: {} })), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const rows = useMemo(
    () =>
      ranked.filter(
        (r) =>
          (minFit === 0 || (r.score.fit ?? 0) >= minFit) &&
          (confidence === 'all' || r.score.confidence === confidence) &&
          (source === 'all' || r.candidate.source === source),
      ),
    [ranked, minFit, confidence, source],
  );
  const filtersActive = minFit > 0 || confidence !== 'all' || source !== 'all';
  const selected = ranked.find((r) => r.candidate.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Ranked by cautious fit against the role's weighted criteria. Change a weight and the ranking updates live — rows that move are highlighted."
        actions={
          <>
            <JdLink role={role} />
            <HowItWorksLink />
          </>
        }
      />
      <RoleSelector />

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Filter label="Minimum fit">
            <select className="input" value={minFit} onChange={(e) => setMinFit(Number(e.target.value))}>
              <option value={0}>Any</option>
              {[50, 60, 70, 80].map((v) => (
                <option key={v} value={v}>{v}%+</option>
              ))}
            </select>
          </Filter>
          <Filter label="Confidence">
            <select className="input" value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence | 'all')}>
              <option value="all">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </Filter>
          <Filter label="Source">
            <select className="input" value={source} onChange={(e) => setSource(e.target.value as SourceChannel | 'all')}>
              <option value="all">All sources</option>
              {SOURCE_CHANNELS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Filter>
          <div className="block md:w-56">
            <span className="mb-1 block text-xs font-medium text-slate-500">Sort by</span>
            <div className="inline-flex w-full rounded-lg border border-slate-300 bg-white p-0.5" role="radiogroup" aria-label="Sort by">
              {(['cautious', 'raw'] as SortMode[]).map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={sort === m}
                  onClick={() => setSort(m)}
                  className={`flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium ${sort === m ? 'bg-navy-800 text-white' : 'text-navy-700 hover:bg-slate-100'}`}
                >
                  {m === 'cautious' ? 'Cautious (default)' : 'Raw fit'}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-secondary md:ml-auto"
            onClick={() => setShowWeights((s) => !s)}
            aria-expanded={showWeights}
            data-tour="tweak-weights"
          >
            <SlidersHorizontal className="h-4 w-4" /> Tweak weights
            <ChevronDown className={`h-4 w-4 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {showWeights && (
          <div className="mt-4 grid gap-x-8 gap-y-3 border-t border-slate-100 pt-4 md:grid-cols-2">
            {role.criteria.map((c) => (
              <div key={c.id}>
                <div className="mb-1 truncate text-xs font-medium text-navy-800" title={c.name}>{c.name}</div>
                <WeightSlider role={role} criterion={c} />
              </div>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={ranked.length === 0 ? 'No candidates for this role yet' : 'No candidates match these filters'}
          action={
            filtersActive && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setMinFit(0);
                  setConfidence('all');
                  setSource('all');
                }}
              >
                Clear filters
              </button>
            )
          }
        >
          {filtersActive ? 'Try loosening the minimum fit or confidence.' : 'Add candidates to start ranking.'}
        </EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Headline</th>
                  <th className="px-4 py-3 font-medium">Fit</th>
                  <th className="px-4 py-3 font-medium">Coverage</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const delta = flash.moved[r.candidate.id];
                  return (
                    <tr
                      key={`${r.candidate.id}-${delta ? flash.tick : 0}`}
                      onClick={() => setSelectedId(r.candidate.id)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedId(r.candidate.id))}
                      tabIndex={0}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${delta ? 'animate-moved' : ''}`}
                    >
                      <td className="px-4 py-3 tabular-nums text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {r.rank}
                          {delta ? (
                            <span className={`inline-flex items-center text-xs font-medium ${delta > 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                              {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {Math.abs(delta)}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap font-medium text-navy-900">{r.candidate.name}</span>
                          <ProfileLink candidate={r.candidate} iconOnly className="rounded p-0.5 text-slate-400 hover:text-teal-700" />
                          {r.mustHaves.flagged && <FlagChip label="Must-have" />}
                        </div>
                        {r.needsMoreEvidence && (
                          <span className="chip mt-1 bg-amber-50 text-amber-700" title="Find out more before contacting">
                            Needs more evidence
                          </span>
                        )}
                        <div className="whitespace-nowrap text-xs text-slate-500">{r.candidate.employer}</div>
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-slate-600">{r.candidate.headline}</td>
                      <td className="px-4 py-3">
                        <FitBar fit={r.score.fit} />
                        {r.score.fit !== null && Math.round(r.cautiousFit) !== Math.round(r.score.fit) && (
                          <span className="mt-0.5 block text-xs text-slate-400" title="Cautious fit — used for ranking">
                            cautious {Math.round(r.cautiousFit)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="tabular-nums">{Math.round(r.score.coverage)}%</span>
                        <span className="block text-xs text-slate-400">{r.score.evidencedCount} of {r.score.totalCount}</span>
                      </td>
                      <td className="px-4 py-3"><ConfidenceChip confidence={r.score.confidence} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.candidate.source}</td>
                      <td className="px-4 py-3"><StatusChip status={r.candidate.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {sort === 'cautious'
                ? 'Ranked by cautious fit: thin profiles are pulled towards the role average.'
                : 'Ranked by raw fit only — thin profiles may rank high.'}{' '}
              Missing evidence lowers confidence, never fit. Click a row for details.
            </p>
            <HowCalculated align="right" />
          </div>
        </div>
      )}

      <CandidatePanel role={role} ranked={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block md:w-48">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
