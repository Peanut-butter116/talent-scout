import { DISCLAIMER } from '../components/Disclaimer';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { PageHeader } from '../components/PageHeader';

export function AboutPage() {
  return (
    <>
      <PageHeader title="About" subtitle="A concept, built proactively by a job candidate." />
      <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink-600">
        <p className="font-medium text-ink-900">{DISCLAIMER}</p>
        <p>A weekly loop: shortlist, coffee chats, and a rubric that learns which criteria really predict a great hire.</p>
        <p>Simple, transparent rules — not live AI. No backend, no tracking. Your edits stay in this browser.</p>
        <HowItWorksLink label="How it works" className="btn-secondary" />
      </div>
    </>
  );
}
