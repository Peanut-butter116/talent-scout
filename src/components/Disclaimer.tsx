import { Link } from 'react-router-dom';

export const CONTACT_NAME = 'Sijia He';
export const CONTACT_EMAIL = 'sijia.he116@outlook.com';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Talent Scout')}`;

/** The one credit line, shown once per page in the footer. */
export function CreditLine({ className = '', withAbout = false }: { className?: string; withAbout?: boolean }) {
  return (
    <p className={`text-xs leading-relaxed text-ink-400 ${className}`}>
      A portfolio project by {CONTACT_NAME} ·{' '}
      <a href={CONTACT_HREF} className="text-ink-600 underline decoration-ink-300 underline-offset-2 hover:text-ink-900">
        Contact
      </a>
      {withAbout && (
        <>
          {' · '}
          <Link to="/about" className="text-ink-600 underline decoration-ink-300 underline-offset-2 hover:text-ink-900">
            About
          </Link>
        </>
      )}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-100 pb-4 pt-5">
      <CreditLine />
    </footer>
  );
}
