import { HelpCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NEEDS_EVIDENCE_COVERAGE } from '../lib/scoring';
import { HowItWorksLink } from './HowItWorksLink';

/** Small plain-English popover explaining fit, cautious fit and confidence. */
export function HowCalculated({ align = 'left' }: { align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden /> How is this calculated?
      </button>
      {open && (
        <div
          className={`absolute z-40 mt-2 w-80 max-w-[85vw] rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="dialog"
          aria-label="How scores are calculated"
        >
          <button className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <p className="font-semibold text-navy-900">Fit</p>
          <p className="mt-0.5">
            The weighted average of the ratings we <em>have</em>. Missing evidence is left out, never counted as zero.
          </p>
          <p className="mt-3 font-semibold text-navy-900">Ranking (cautious fit)</p>
          <p className="mt-0.5">
            Fit, pulled towards the role average by how much is unknown:{' '}
            <span className="whitespace-nowrap font-mono text-xs">coverage × fit + (1 − coverage) × average</span>. Thin profiles
            can't top the list on two good ratings. Under {NEEDS_EVIDENCE_COVERAGE}% coverage we suggest finding out more first.
          </p>
          <p className="mt-3 font-semibold text-navy-900">Confidence</p>
          <p className="mt-0.5">
            High needs at least 80% of the weight evidenced, mostly by strong evidence. Low means under half evidenced, or mostly weak.
          </p>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <HowItWorksLink label="Full explanation" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800" />
          </div>
        </div>
      )}
    </div>
  );
}
