import { AlertTriangle, ArrowRight, ListPlus, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABEL } from '../lib/pipeline';
import { uncertainties, type RankedCandidate } from '../lib/scoring';
import { useAppState } from '../state/AppState';
import type { MustHaveValue, Role } from '../types';
import { ConfidenceChip, FlagChip, StatusChip, StrengthChip } from './Chips';
import { RatingDots } from './FitBar';
import { HowCalculated } from './HowCalculated';
import { OutreachModal } from './OutreachModal';
import { ProfileActions } from './ProfileActions';
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
            <h2 className="text-xl font-semibold text-ink-900">{c.name}</h2>
            <StatusChip status={c.status} />
            {mustHaves.flagged && <FlagChip />}
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            {c.headline} · {c.employer}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            #{ranked.rank} · {c.source}
          </p>
          <div className="mt-3">
            <ProfileActions candidate={c} onContact={() => setContacting(true)} size="sm" />
          </div>
        </>
      }
      footer={
        canShortlist ? (
          <button
            className="btn-primary w-full"
            onClick={() => dispatch({ type: 'SET_STATUS', candidateIds: [c.id], status: 'suggested' })}
          >
            <ListPlus className="h-4 w-4" /> Add to shortlist
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink-500">{STATUS_LABEL[c.status]}</span>
            <Link to="/pipeline" className="btn-secondary">
              Pipeline <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      }
    >
      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-ink-50 p-4">
        <Stat label="Fit" value={score.fit === null ? '—' : `${Math.round(ranked.cautiousFit)}%`} sub={score.fit !== null ? `raw ${Math.round(score.fit)}%` : undefined} />
        <Stat label="Coverage" value={`${Math.round(score.coverage)}%`} sub={`${score.evidencedCount} of ${score.totalCount}`} />
        <div>
          <div className="mb-1 text-xs text-ink-400">Confidence</div>
          <ConfidenceChip confidence={score.confidence} />
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <HowCalculated align="right" />
      </div>

      {ranked.needsMoreEvidence && (
        <p className="mt-3 text-sm text-amber-700">Needs more evidence — find out more before contacting.</p>
      )}
      {c.contactNote && <p className="mt-3 text-sm text-ink-500">{c.contactNote}</p>}

      {mustHaves.checks.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Must-haves</h3>
          <ul className="space-y-2">
            {mustHaves.checks.map((m) => (
              <li key={m.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-ink-700">{m.label}</span>
                  <Segmented
                    value={m.value}
                    onChange={(value) =>
                      dispatch({ type: 'SET_MUST_HAVE_VALUE', candidateId: c.id, mustHaveId: m.id, value })
                    }
                  />
                </div>
                {m.value === 'unknown' && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                    <PhoneCall className="h-3.5 w-3.5" /> Check at first call
                  </p>
                )}
                {m.value === 'no' && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> Flagged — not auto-shortlisted
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h3 className="mb-1 text-sm font-semibold text-ink-900">Evidence</h3>
        <ul className="divide-y divide-ink-100">
          {role.criteria.map((cr) => {
            const e = c.evidence[cr.id];
            return (
              <li key={cr.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-ink-900">{cr.name}</span>
                  <StrengthChip strength={e ? e.strength : 'missing'} />
                </div>
                {e && (
                  <div className="mt-1 flex items-start gap-2 text-sm text-ink-500">
                    <span className="mt-1.5"><RatingDots rating={e.rating} /></span>
                    <span>{e.note}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {(missing.length > 0 || weak.length > 0) && (
        <section className="mt-8">
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Ask about</h3>
          <ul className="space-y-1 text-sm text-ink-500">
            {[...missing, ...weak].map((m) => (
              <li key={m.id}>· {m.name}</li>
            ))}
          </ul>
        </section>
      )}
      {contacting && <OutreachModal candidate={c} role={role} onClose={() => setContacting(false)} />}
    </SidePanel>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-ink-400">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-ink-900">{value}</div>
      {sub && <div className="text-xs text-ink-400">{sub}</div>}
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
    <div className="inline-flex rounded-full bg-ink-100 p-0.5" role="radiogroup">
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-full px-3 py-1 text-xs ${
            value === o.v ? 'bg-white font-medium text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
