import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState icon={Compass} title="That page doesn't exist." action={<Link className="btn-primary" to="/roles">Go home</Link>} />
  );
}
