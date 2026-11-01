/** "Built for [Glot]" — small; Talent Scout stays the product name. Logo served from /public. */
export function BuiltForGlot({ className = '', size = 'sm' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-ink-400 ${size === 'md' ? 'text-sm' : 'text-xs'} ${className}`}>
      Built for
      <img
        src="/glot-logo.svg"
        alt="Glot"
        className={size === 'md' ? 'h-[18px] w-auto' : 'h-3.5 w-auto'}
        width={size === 'md' ? 67 : 52}
        height={size === 'md' ? 18 : 14}
      />
    </span>
  );
}
