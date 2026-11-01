import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** One line + one button. */
export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-ink-50 px-6 py-12 text-center">
      <Icon className="mb-3 h-5 w-5 text-ink-400" aria-hidden />
      <p className="text-sm text-ink-600">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
