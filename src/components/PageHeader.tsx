import type { ReactNode } from 'react';

/** Title (2–4 words) + at most one short line. Explanations go behind a "?" or on How it works. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold text-ink-900 sm:text-[2.1rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
