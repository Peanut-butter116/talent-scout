import { FlaskConical } from 'lucide-react';

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`chip border border-teal-200 bg-teal-50 text-teal-800 ${className}`}
      title="Everything here is a demo. All candidates and activity are fictional."
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      Interactive demo · fictional candidates
    </span>
  );
}
