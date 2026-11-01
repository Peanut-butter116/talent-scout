export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`chip bg-teal-50 text-teal-800 ${className}`}
      title="Everything here is a demo. All candidates and activity are fictional."
    >
      Interactive demo · fictional candidates
    </span>
  );
}
