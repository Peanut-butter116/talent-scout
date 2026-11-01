import { BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

/** Links to the explanation page and remembers where the visitor came from. */
export function HowItWorksLink({
  label = 'How ranking works',
  hash,
  className = 'btn-ghost text-sm',
}: {
  label?: string;
  hash?: string;
  className?: string;
}) {
  const location = useLocation();
  return (
    <Link
      to={{ pathname: '/how-it-works', hash }}
      state={{ from: location.pathname + location.search }}
      className={className}
    >
      <BookOpen className="h-4 w-4" aria-hidden /> {label}
    </Link>
  );
}
