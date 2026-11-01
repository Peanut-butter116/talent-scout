import { Check, Copy, ExternalLink, MailX, X } from 'lucide-react';
import { DEMO_PROFILE_TOOLTIP } from '../lib/profile';
import { useEffect, useState } from 'react';
import { draftOutreach } from '../lib/pipeline';
import type { Candidate, Role } from '../types';

export function OutreachModal({
  candidate,
  role,
  onClose,
  onMarkContacted,
}: {
  candidate: Candidate;
  role: Role;
  onClose: () => void;
  onMarkContacted?: () => void;
}) {
  const [text, setText] = useState(() => draftOutreach(candidate, role));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Capture phase so Escape closes only this draft, not a panel or review underneath.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the text is still selectable in the box.
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-ink-950/30 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Draft outreach">
      <div className="w-full max-w-xl rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Message {candidate.name.split(' ')[0]}</h2>
            <p className="text-sm text-ink-500">{role.title}</p>
          </div>
          <button className="btn-ghost -mr-2 p-2" onClick={onClose} aria-label="Close draft">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-3">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <MailX className="h-3.5 w-3.5 shrink-0" />
            Draft only — not sent
          </p>
          {candidate.contactNote && <p className="mb-3 text-sm text-ink-500">{candidate.contactNote}</p>}
          <textarea
            className="input h-64 resize-y font-[inherit] leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Outreach message"
          />
        </div>
        <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy message'}
          </button>
          {candidate.profileUrl ? (
            <a className="btn-secondary" href={candidate.profileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Open profile
            </a>
          ) : (
            <span title={DEMO_PROFILE_TOOLTIP} className="inline-flex">
              <button className="btn-secondary w-full" disabled>
                <ExternalLink className="h-4 w-4" /> Open profile
              </button>
            </span>
          )}
          {onMarkContacted && (
            <button
              className="btn-primary"
              onClick={() => {
                onMarkContacted();
                onClose();
              }}
            >
              Mark contacted
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
