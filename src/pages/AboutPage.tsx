import { PageHeader } from '../components/PageHeader';
import { DISCLAIMER } from '../components/Disclaimer';

export function AboutPage() {
  return (
    <>
      <PageHeader title="About this project" />
      <div className="card max-w-2xl space-y-4 p-6 text-sm leading-relaxed text-slate-700">
        <p className="font-medium text-navy-900">{DISCLAIMER}</p>
        <p>
          Talent Scout is a concept built proactively by a job candidate. It shows how Glot could
          produce a weekly shortlist of people to reach out to, have coffee chats with them, and use
          what it learns to sharpen what it looks for.
        </p>
        <p>
          The core idea: every hiring criterion is a <strong>hypothesis</strong> — “this background
          predicts a strong hire”. Candidates are scored against weighted criteria, a shortlist is
          approved each week, chats happen, feedback is logged, and the app shows which criteria are
          holding up.
        </p>
        <p>
          The analysis is a set of simple, transparent rules running in your browser — not live AI.
          Samples are small, so results are indicative only; a human decides.
        </p>
        <p>
          There is no backend, no tracking and no network calls. Your edits are saved only in this
          browser, and “Reset demo” restores the original data.
        </p>
      </div>
    </>
  );
}
