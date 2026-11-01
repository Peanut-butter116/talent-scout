import { AlertTriangle, Globe2 } from 'lucide-react';
import type { HypothesisLabel } from '../lib/analysis';
import { STATUS_LABEL } from '../lib/pipeline';
import type { Confidence } from '../lib/scoring';
import type { EvidenceStrength, PipelineStatus } from '../types';

const HYP: Record<HypothesisLabel, string> = {
  'Holding up': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Unclear: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Not supported': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  'Not tested yet': 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

export function HypothesisChip({ label }: { label: HypothesisLabel }) {
  return (
    <span className={`chip ${HYP[label]}`} title="Hypothesis status, from coffee-chat feedback on the Learning page">
      <span className="text-[10px] uppercase tracking-wide opacity-70">Hypothesis</span>
      {label}
    </span>
  );
}

export function GlotWideBadge() {
  return (
    <span className="chip bg-navy-50 text-navy-600 ring-1 ring-navy-100" title="Appears in every Glot role">
      <Globe2 className="h-3 w-3" aria-hidden />
      Glot-wide quality
    </span>
  );
}

const CONF: Record<Confidence, string> = {
  High: 'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  return <span className={`chip ${CONF[confidence]}`}>{confidence}</span>;
}

const STATUS: Record<PipelineStatus, string> = {
  new: 'bg-slate-100 text-slate-600',
  suggested: 'bg-sky-50 text-sky-700',
  approved: 'bg-indigo-50 text-indigo-700',
  contacted: 'bg-violet-50 text-violet-700',
  booked: 'bg-teal-50 text-teal-700',
  done: 'bg-emerald-50 text-emerald-700',
  skipped: 'bg-slate-100 text-slate-500 line-through decoration-slate-400',
};

export function StatusChip({ status }: { status: PipelineStatus }) {
  return <span className={`chip ${STATUS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function StrengthChip({ strength }: { strength: EvidenceStrength | 'missing' }) {
  if (strength === 'missing')
    return <span className="chip border border-dashed border-slate-300 text-slate-500">Missing</span>;
  return strength === 'strong' ? (
    <span className="chip bg-teal-50 text-teal-700">Strong</span>
  ) : (
    <span className="chip bg-amber-50 text-amber-700">Weak</span>
  );
}

export function FlagChip({ label = 'Must-have: No' }: { label?: string }) {
  return (
    <span className="chip bg-rose-50 text-rose-700">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
