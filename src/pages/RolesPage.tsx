import { ListChecks } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function RolesPage() {
  return (
    <>
      <PageHeader title="Roles & Criteria" subtitle="Every criterion is a hypothesis about what predicts a strong hire. Adjust the weights and watch the ranking change." />
      <EmptyState icon={ListChecks} title="This page is being built">
        Coming in phase 2 of the build.
      </EmptyState>
    </>
  );
}
