export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`chip bg-ink-100 text-ink-600 ${className}`}
      title="Everything here is a demo. All candidates and activity are fictional."
    >
      Interactive demo · fictional candidates
    </span>
  );
}
