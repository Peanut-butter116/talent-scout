import { AlertTriangle } from 'lucide-react';
import type { HypothesisLabel } from '../lib/analysis';
import { STATUS_LABEL } from '../lib/pipeline';
import type { Confidence } from '../lib/scoring';
import type { EvidenceStrength, PipelineStatus } from '../types';

function Dot({ className }: { className: string }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${className}`} aria-hidden />;
}

const HYP_DOT: Record<HypothesisLabel, string> = {
  'Holding up': 'bg-teal-600',
  Unclear: 'bg-amber-400',
  'Not supported': 'bg-rose-500',
  'Not tested yet': 'bg-ink-300',
};

export function HypothesisChip({ label }: { label: HypothesisLabel }) {
  return (
    <span className="chip bg-white text-ink-700 ring-1 ring-ink-200" title={`Hypothesis: ${label}`}>
      <Dot className={HYP_DOT[label]} />
      {label}
    </span>
  );
}

export function GlotWideBadge() {
  return (
    <span className="chip bg-ink-100 text-ink-500" title="Appears in every Glot role">
      Glot-wide quality
    </span>
  );
}

const CONF_DOT: Record<Confidence, string> = {
  High: 'bg-teal-600',
  Medium: 'bg-amber-400',
  Low: 'bg-ink-300',
};

export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  return (
    <span className="chip px-0 text-ink-700">
      <Dot className={CONF_DOT[confidence]} />
      {confidence}
    </span>
  );
}

export function StatusChip({ status }: { status: PipelineStatus }) {
  const tone =
    status === 'done' || status === 'booked'
      ? 'bg-teal-50 text-teal-800'
      : status === 'new'
        ? 'text-ink-400'
        : status === 'skipped'
          ? 'bg-ink-100 text-ink-400'
          : 'bg-ink-100 text-ink-700';
  return <span className={`chip ${tone}`}>{STATUS_LABEL[status]}</span>;
}

export function StrengthChip({ strength }: { strength: EvidenceStrength | 'missing' }) {
  if (strength === 'missing') return <span className="chip text-ink-400 ring-1 ring-dashed ring-ink-200">Missing</span>;
  return strength === 'strong' ? (
    <span className="chip bg-teal-50 text-teal-800">Strong</span>
  ) : (
    <span className="chip bg-amber-50 text-amber-800">Weak</span>
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
