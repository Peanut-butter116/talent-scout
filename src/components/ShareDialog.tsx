import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { startOfWeek } from '../lib/pipeline';
import { compareCautious, rankCandidates } from '../lib/scoring';
import { encodeReviewHash, isShareable, MAX_SHARED, weekKey } from '../lib/share';
import { useAppState } from '../state/AppState';

/** "Shortlist ready" popup: open the CEO review in a new tab, or copy a link for the CEO. */
export function ShareDialog({ roleId, onClose }: { roleId: string | null; onClose: () => void }) {
  const { state } = useAppState();
  const [copied, setCopied] = useState(false);

  const { ids, excluded } = useMemo(() => {
    const suggested = state.roles
      .filter((r) => roleId === null || r.id === roleId)
      .flatMap((r) => rankCandidates(state.candidates, r))
      .filter((r) => r.candidate.status === 'suggested')
      .sort(compareCautious)
      .slice(0, MAX_SHARED)
      .map((r) => r.candidate.id);
    return { ids: suggested.filter(isShareable), excluded: suggested.filter((id) => !isShareable(id)).length };
  }, [state.roles, state.candidates, roleId]);

  const url = `${window.location.origin}/review${encodeReviewHash({
    roleId: roleId ?? 'all',
    week: weekKey(startOfWeek(new Date())),
    candidateIds: ids,
  })}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/30 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Shortlist ready">
      <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <button className="btn-ghost absolute right-3 top-3 p-2" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        {ids.length === 0 ? (
          <>
            <h2 className="text-lg font-semibold text-ink-900">Nothing to share yet</h2>
            <p className="mt-1 text-sm text-ink-500">Generate a shortlist first.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-ink-900">
              Shortlist ready — {ids.length} {ids.length === 1 ? 'candidate' : 'candidates'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">Send it to the CEO to swipe through.</p>
            <div className="mt-5 flex flex-col gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full" data-tour="open-review">
                Open review <ExternalLink className="h-4 w-4" />
              </a>
              <button className="btn-secondary w-full" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link copied' : 'Copy link for CEO'}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-400">The link holds only IDs — no names or evidence.</p>
          </>
        )}
        {excluded > 0 && <p className="mt-2 text-xs text-ink-400">Added profiles can't be shared by link in the demo.</p>}
      </div>
    </div>
  );
}
