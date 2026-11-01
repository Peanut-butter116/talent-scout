import { BarChart3 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function LearningPage() {
  return (
    <>
      <PageHeader title="Learning" subtitle="Which hypotheses are holding up, based on coffee-chat feedback." />
      <EmptyState icon={BarChart3} title="This page is being built">
        Coming in phase 4 of the build.
      </EmptyState>
    </>
  );
}
