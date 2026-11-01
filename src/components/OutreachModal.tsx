import { Check, Copy, MailX, X } from 'lucide-react';
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Draft outreach">
      <div className="w-full max-w-xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-navy-900">Draft outreach to {candidate.name}</h2>
            <p className="text-xs text-slate-500">{role.title} · references their strongest evidence</p>
          </div>
          <button className="btn-ghost -mr-2 p-2" onClick={onClose} aria-label="Close draft">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            <MailX className="h-4 w-4 shrink-0" />
            Draft only — not sent. Talent Scout never sends messages.
          </div>
          <textarea
            className="input h-64 resize-y font-[inherit] leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Outreach message"
          />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button className="btn-secondary" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy text'}
          </button>
          {onMarkContacted && (
            <button
              className="btn-primary"
              onClick={() => {
                onMarkContacted();
                onClose();
              }}
            >
              I've sent it myself — mark contacted
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
