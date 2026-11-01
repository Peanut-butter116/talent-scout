import { Users } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function CandidatesPage() {
  return (
    <>
      <PageHeader title="Candidates" subtitle="Fictional candidates ranked against the selected role's weighted criteria." />
      <EmptyState icon={Users} title="This page is being built">
        Coming in phase 2 of the build.
      </EmptyState>
    </>
  );
}
