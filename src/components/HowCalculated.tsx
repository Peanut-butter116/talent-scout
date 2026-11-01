import { NEEDS_EVIDENCE_COVERAGE, NEUTRAL_FIT } from '../lib/scoring';
import { HowItWorksLink } from './HowItWorksLink';
import { InfoTip } from './InfoTip';

/** "How is this calculated?" — fit, cautious fit and confidence in a few lines. */
export function HowCalculated({ align = 'left' }: { align?: 'left' | 'right' }) {
  return (
    <InfoTip label="How is this calculated?" text="How is this calculated?" align={align}>
      <span className="block font-medium text-ink-900">Fit</span>
      <span className="block">Weighted average of the ratings we have. Missing ones are left out.</span>
      <span className="mt-3 block font-medium text-ink-900">Ranking</span>
      <span className="block font-mono text-xs">coverage × fit + (1 − coverage) × {NEUTRAL_FIT}</span>
      <span className="block">Unknowns count as neutral. Under {NEEDS_EVIDENCE_COVERAGE}% coverage: find out more first.</span>
      <span className="mt-3 block font-medium text-ink-900">Confidence</span>
      <span className="block">How much of the profile is evidenced, and how strongly.</span>
      <span className="mt-3 block">
        <HowItWorksLink label="How it works" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800" />
      </span>
    </InfoTip>
  );
}
