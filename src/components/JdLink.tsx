import { ExternalLink } from 'lucide-react';
import type { Role } from '../types';

export function JdLink({ role, className = '' }: { role: Role; className?: string }) {
  if (!role.jdUrl) return null;
  return (
    <a
      href={role.jdUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900 ${className}`}
    >
      View job description <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}
