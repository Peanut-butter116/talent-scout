import { HelpCircle, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Small "?" that opens a short explanation. Keeps pages free of explanatory paragraphs. */
export function InfoTip({
  children,
  label = 'More info',
  align = 'left',
  text,
}: {
  children: ReactNode;
  label?: string;
  align?: 'left' | 'right';
  /** Optional visible text next to the icon. */
  text?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="relative inline-flex align-middle" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full p-0.5 text-xs font-medium text-ink-400 hover:text-ink-700"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={text ? undefined : label}
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
        {text}
      </button>
      {open && (
        <span
          role="dialog"
          aria-label={label}
          className={`absolute top-full z-40 mt-2 block w-72 max-w-[80vw] rounded-2xl bg-white p-4 text-left text-sm font-normal normal-case leading-relaxed tracking-normal text-ink-600 shadow-xl ring-1 ring-ink-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <button
            type="button"
            className="absolute right-2 top-2 p-1 text-ink-300 hover:text-ink-600"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {children}
        </span>
      )}
    </span>
  );
}
