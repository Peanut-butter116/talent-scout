import { ExternalLink, MessageSquare, UserRound } from 'lucide-react';
import { DEMO_PROFILE_TOOLTIP } from '../lib/profile';
import type { Candidate } from '../types';

/** "View profile" + "Contact" actions. Seeded demo candidates have no profile link. */
export function ProfileActions({
  candidate,
  onContact,
  size = 'md',
}: {
  candidate: Candidate;
  onContact: () => void;
  size?: 'sm' | 'md';
}) {
  const sm = size === 'sm';
  const cls = sm
    ? 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'
    : 'btn-secondary';
  return (
    <div className="flex flex-wrap gap-1.5" data-no-drag>
      <ProfileLink candidate={candidate} className={cls} label="View profile" iconOnly={false} />
      <button className={cls} onClick={onContact} onPointerDown={(e) => e.stopPropagation()}>
        <MessageSquare className={sm ? 'h-3 w-3' : 'h-4 w-4'} /> Contact
      </button>
    </div>
  );
}

export function ProfileLink({
  candidate,
  className,
  label = 'View profile',
  iconOnly,
}: {
  candidate: Candidate;
  className: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const icon = <UserRound className={iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden />;
  if (candidate.profileUrl) {
    return (
      <a
        href={candidate.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={`Open ${candidate.name}'s profile in a new tab`}
        aria-label={iconOnly ? `Open ${candidate.name}'s profile` : undefined}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {icon}
        {!iconOnly && label}
        {!iconOnly && <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />}
      </a>
    );
  }
  return (
    <span title={DEMO_PROFILE_TOOLTIP} className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled
        className={`${className} cursor-not-allowed opacity-50`}
        aria-label={iconOnly ? `${DEMO_PROFILE_TOOLTIP}` : undefined}
        aria-describedby={undefined}
      >
        {icon}
        {!iconOnly && label}
      </button>
    </span>
  );
}
