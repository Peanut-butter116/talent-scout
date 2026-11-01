import { KanbanSquare } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function PipelinePage() {
  return (
    <>
      <PageHeader title="Pipeline" subtitle="This week's shortlist, outreach and coffee chats." />
      <EmptyState icon={KanbanSquare} title="This page is being built">
        Coming in phase 3 of the build.
      </EmptyState>
    </>
  );
}
