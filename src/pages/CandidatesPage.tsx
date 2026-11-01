import { ArrowDown, ArrowUp, SearchX, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CandidatePanel } from '../components/CandidatePanel';
import { ConfidenceChip, FlagChip, StatusChip } from '../components/Chips';
import { WeightSlider } from '../components/CriterionRow';
import { EmptyState } from '../components/EmptyState';
import { HowCalculated } from '../components/HowCalculated';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { JdLink } from '../components/JdLink';
import { PageHeader } from '../components/PageHeader';
import { ProfileLink } from '../components/ProfileActions';
import { RoleSelector } from '../components/RoleSelector';
import type { Confidence, RankedCandidate, SortMode } from '../lib/scoring';
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
  const rowKey = (r: RankedCandidate) => `${r.candidate.id}-${flash.moved[r.candidate.id] ? flash.tick : 0}`;

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Ranked live against the role's criteria."
        actions={
          <>
            <JdLink role={role} />
            <HowItWorksLink />
          </>
        }
      />
      <RoleSelector />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Segmented
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as SortMode)}
          options={[
            { value: 'cautious', label: 'Cautious (default)' },
            { value: 'raw', label: 'Raw fit' },
          ]}
        />
        <Select label="Minimum fit" value={String(minFit)} onChange={(v) => setMinFit(Number(v))}>
          <option value="0">Any fit</option>
          {[50, 60, 70, 80].map((v) => (
            <option key={v} value={v}>{v}%+</option>
          ))}
        </Select>
        <Select label="Confidence" value={confidence} onChange={(v) => setConfidence(v as Confidence | 'all')}>
          <option value="all">Any confidence</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>
        <Select label="Source" value={source} onChange={(v) => setSource(v as SourceChannel | 'all')}>
          <option value="all">Any source</option>
          {SOURCE_CHANNELS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <button
          className={`btn ${showWeights ? 'bg-ink-900 text-white' : 'text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'}`}
          onClick={() => setShowWeights((s) => !s)}
          aria-expanded={showWeights}
          data-tour="tweak-weights"
        >
          <SlidersHorizontal className="h-4 w-4" /> Weights
        </button>
      </div>

      {showWeights && (
        <div className="card mb-6 grid gap-x-8 gap-y-4 p-5 md:grid-cols-2">
          {role.criteria.map((c) => (
            <div key={c.id}>
              <div className="mb-1 truncate text-xs text-ink-500" title={c.name}>{c.name}</div>
              <WeightSlider role={role} criterion={c} />
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={ranked.length === 0 ? 'No candidates for this role yet.' : 'No one matches these filters.'}
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
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => {
              const delta = flash.moved[r.candidate.id];
              return (
                <li key={rowKey(r)}>
                  <button
                    onClick={() => setSelectedId(r.candidate.id)}
                    className={`w-full rounded-2xl bg-ink-50 p-4 text-left ${delta ? 'animate-moved' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 pt-0.5 text-sm tabular-nums text-ink-400">
                        {r.rank}
                        <Delta delta={delta} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-ink-900">{r.candidate.name}</span>
                          {r.mustHaves.flagged && <FlagChip label="Must-have" />}
                        </div>
                        <div className="truncate text-sm text-ink-500">{r.candidate.headline}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                          <ConfidenceChip confidence={r.score.confidence} />
                          <span>{Math.round(r.score.coverage)}% evidenced</span>
                          <span>{r.candidate.source}</span>
                        </div>
                        {r.needsMoreEvidence && <NeedsEvidence />}
                      </div>
                      <Fit r={r} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-ink-400">
                <tr className="border-b border-ink-100">
                  <th className="py-3 pr-3 font-medium">#</th>
                  <th className="py-3 pr-3 font-medium">Name</th>
                  <th className="py-3 pr-3 font-medium">Headline</th>
                  <th className="py-3 pr-3 font-medium">Fit</th>
                  <th className="py-3 pr-3 font-medium">Coverage</th>
                  <th className="py-3 pr-3 font-medium">Confidence</th>
                  <th className="py-3 pr-3 font-medium">Source</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((r) => {
                  const delta = flash.moved[r.candidate.id];
                  return (
                    <tr
                      key={rowKey(r)}
                      onClick={() => setSelectedId(r.candidate.id)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedId(r.candidate.id))}
                      tabIndex={0}
                      className={`cursor-pointer transition-colors hover:bg-ink-50 focus:bg-ink-50 focus:outline-none ${delta ? 'animate-moved' : ''}`}
                    >
                      <td className="py-4 pr-3 tabular-nums text-ink-400">
                        <span className="inline-flex items-center gap-1">
                          {r.rank}
                          <Delta delta={delta} />
                        </span>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="whitespace-nowrap font-medium text-ink-900">{r.candidate.name}</span>
                          <ProfileLink candidate={r.candidate} iconOnly className="rounded-full p-0.5 text-ink-300 hover:text-teal-700" />
                          {r.mustHaves.flagged && <FlagChip label="Must-have" />}
                        </div>
                        {r.needsMoreEvidence && <NeedsEvidence />}
                      </td>
                      <td className="max-w-[220px] py-4 pr-3 text-ink-500">{r.candidate.headline}</td>
                      <td className="py-4 pr-3"><Fit r={r} align="left" /></td>
                      <td className="py-4 pr-3 tabular-nums text-ink-500">{Math.round(r.score.coverage)}%</td>
                      <td className="py-4 pr-3"><ConfidenceChip confidence={r.score.confidence} /></td>
                      <td className="whitespace-nowrap py-4 pr-3 text-ink-500">{r.candidate.source}</td>
                      <td className="py-4"><StatusChip status={r.candidate.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <HowCalculated align="right" />
          </div>
        </>
      )}

      <CandidatePanel role={role} ranked={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

function Fit({ r, align = 'right' }: { r: RankedCandidate; align?: 'left' | 'right' }) {
  if (r.score.fit === null) return <span className="text-sm text-ink-400">—</span>;
  const shown = Math.round(r.cautiousFit);
  const raw = Math.round(r.score.fit);
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className="text-base font-semibold tabular-nums text-ink-900">{shown}%</div>
      {raw !== shown && <div className="text-xs tabular-nums text-ink-400">raw {raw}%</div>}
    </div>
  );
}

function Delta({ delta }: { delta?: number }) {
  if (!delta) return null;
  return (
    <span className={`inline-flex items-center text-xs font-medium ${delta > 0 ? 'text-teal-700' : 'text-rose-600'}`}>
      {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

function NeedsEvidence() {
  return (
    <span className="mt-1 inline-block text-xs text-amber-700" title="Find out more before contacting">
      Needs more evidence
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      className="rounded-full border-0 bg-white py-2 pl-3.5 pr-8 text-sm text-ink-700 ring-1 ring-ink-200 focus:ring-2 focus:ring-teal-600"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

export function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full bg-ink-100 p-0.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm ${
            value === o.value ? 'bg-white font-medium text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
