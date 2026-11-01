import { AlertTriangle, ArrowRight, CircleHelp, ListPlus, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HowCalculated } from './HowCalculated';
import { OutreachModal } from './OutreachModal';
import { ProfileActions } from './ProfileActions';
import { STATUS_LABEL } from '../lib/pipeline';
import { uncertainties, type RankedCandidate } from '../lib/scoring';
import { useAppState } from '../state/AppState';
import type { MustHaveValue, Role } from '../types';
import { ConfidenceChip, FlagChip, StatusChip, StrengthChip } from './Chips';
import { FitBar, RatingDots } from './FitBar';
import { SidePanel } from './SidePanel';

export function CandidatePanel({
  role,
  ranked,
  onClose,
}: {
  role: Role;
  ranked: RankedCandidate | null;
  onClose: () => void;
}) {
  const { dispatch } = useAppState();
  const [contacting, setContacting] = useState(false);
  if (!ranked) return null;
  const { candidate: c, score, mustHaves } = ranked;
  const { missing, weak } = uncertainties(c, role);
  const canShortlist = c.status === 'new' || c.status === 'skipped';

  return (
    <SidePanel
      open
      onClose={onClose}
      title={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-navy-900">{c.name}</h2>
            <StatusChip status={c.status} />
            {mustHaves.flagged && <FlagChip />}
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            {c.headline} · {c.employer}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Rank #{ranked.rank} for {role.title} · Source: {c.source}
          </p>
          <div className="mt-3">
            <ProfileActions candidate={c} onContact={() => setContacting(true)} size="sm" />
          </div>
        </>
      }
      footer={
        canShortlist ? (
          <button
            className="btn-teal w-full"
            onClick={() => dispatch({ type: 'SET_STATUS', candidateIds: [c.id], status: 'suggested' })}
          >
            <ListPlus className="h-4 w-4" /> Add to shortlist
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">
              In pipeline: <strong className="text-navy-900">{STATUS_LABEL[c.status]}</strong>
            </span>
            <Link to="/pipeline" className="btn-secondary">
              Open pipeline <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      }
    >
      <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
        <Stat label="Fit">
          <FitBar fit={score.fit} />
        </Stat>
        <Stat label="Coverage">
          <span className="text-sm font-semibold tabular-nums text-navy-900">{Math.round(score.coverage)}%</span>
          <span className="block text-xs text-slate-500">
            {score.evidencedCount} of {score.totalCount} criteria
          </span>
        </Stat>
        <Stat label="Confidence">
          <ConfidenceChip confidence={score.confidence} />
        </Stat>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Ranking score (cautious fit): <strong className="tabular-nums text-navy-900">{Math.round(ranked.cautiousFit)}%</strong>
        </span>
        <HowCalculated align="right" />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Fit uses only criteria with evidence. Missing evidence lowers confidence, never fit.
      </p>
      {ranked.needsMoreEvidence && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span className="font-medium">Needs more evidence.</span> Find out more before contacting — only{' '}
          {Math.round(score.coverage)}% of the weight is evidenced.
        </div>
      )}
      {c.contactNote && (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium text-navy-900">Contact note:</span> {c.contactNote}
        </p>
      )}

      {mustHaves.checks.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-navy-900">Must-have checks</h3>
          <ul className="space-y-2">
            {mustHaves.checks.map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-navy-900">{m.label}</span>
                  <Segmented
                    value={m.value}
                    onChange={(value) =>
                      dispatch({ type: 'SET_MUST_HAVE_VALUE', candidateId: c.id, mustHaveId: m.id, value })
                    }
                  />
                </div>
                {m.value === 'unknown' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                    <PhoneCall className="h-3.5 w-3.5" /> Check at first call
                  </p>
                )}
                {m.value === 'no' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> Flagged — won't be auto-shortlisted
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Evidence by criterion</h3>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {role.criteria.map((cr) => {
            const e = c.evidence[cr.id];
            return (
              <li key={cr.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-navy-900">{cr.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">w {cr.weight}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StrengthChip strength={e ? e.strength : 'missing'} />
                  {e && <RatingDots rating={e.rating} />}
                  {e && <span className="text-xs tabular-nums text-slate-500">{e.rating}/5</span>}
                </div>
                <p className={`mt-1.5 text-sm ${e ? 'text-slate-700' : 'italic text-slate-400'}`}>
                  {e ? e.note : 'No evidence on profile yet.'}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
          <CircleHelp className="h-4 w-4 text-slate-500" /> What's uncertain
        </h3>
        {missing.length === 0 && weak.length === 0 ? (
          <p className="text-sm text-slate-500">Every criterion has strong evidence. Rare — worth a quick chat.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-slate-700">
            {missing.length > 0 && (
              <li>
                <span className="font-medium">No evidence:</span> {missing.map((m) => m.name).join('; ')}
              </li>
            )}
            {weak.length > 0 && (
              <li>
                <span className="font-medium">Weak evidence only:</span> {weak.map((m) => m.name).join('; ')}
              </li>
            )}
            <li className="text-xs text-slate-500">Good things to probe in a coffee chat.</li>
          </ul>
        )}
      </section>
      {contacting && <OutreachModal candidate={c} role={role} onClose={() => setContacting(false)} />}
    </SidePanel>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function Segmented({ value, onChange }: { value: MustHaveValue; onChange: (v: MustHaveValue) => void }) {
  const opts: { v: MustHaveValue; label: string }[] = [
    { v: 'yes', label: 'Yes' },
    { v: 'no', label: 'No' },
    { v: 'unknown', label: 'Unknown' },
  ];
  return (
    <div className="inline-flex rounded-lg border border-slate-300 p-0.5" role="radiogroup">
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            value === o.v ? 'bg-navy-800 text-white' : 'text-navy-700 hover:bg-slate-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
