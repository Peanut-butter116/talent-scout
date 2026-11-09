import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, CONTACT_HREF } from '../components/Disclaimer';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { COMPANY } from '../data/roles';

/**
 * Portfolio case study. The one long-form page — kept scannable: contents list, short
 * sections, numbered steps. Keep README.md in sync with this page.
 */
const SECTIONS = [
  { id: 'what', title: 'What it is' },
  { id: 'idea', title: 'The idea' },
  { id: 'scoring', title: 'How scoring works' },
  { id: 'manual', title: 'User manual' },
  { id: 'privacy', title: 'Privacy and fairness' },
  { id: 'built', title: 'How it was built' },
  { id: 'limits', title: 'Limits, and what production would need' },
  { id: 'credits', title: 'Credits and contact' },
];

const LOOP = [
  ['Criteria', 'Write down what you think predicts a great hire, with weights.'],
  ['Sourcing', 'Search LinkedIn yourself; paste profiles you like and confirm the evidence.'],
  ['Ranking', 'Everyone is scored against the weights, cautiously when evidence is thin.'],
  ['Review', 'The founder swipes through the weekly shortlist in a couple of minutes.'],
  ['Coffee chats', 'The real test of each assumption.'],
  ['Learning', 'Check which criteria held up, and adjust the weights for next week.'],
];

const link = 'text-accent-700 underline decoration-accent-200 underline-offset-4 hover:decoration-accent-700';

export function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl text-[15px] leading-relaxed text-ink-600">
      <p className="text-sm text-ink-400">A portfolio project by Sijia He</p>
      <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-display text-ink-900 sm:text-[2.6rem]">
        Talent Scout
      </h1>
      <p className="mt-2 text-ink-500">A hiring pipeline that learns which criteria really work.</p>

      <nav className="mt-8 rounded-2xl bg-ink-50 p-5" aria-label="Contents">
        <div className="mb-2 text-xs font-medium text-ink-400">Contents</div>
        <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ink-700 hover:text-ink-900 hover:underline">
                <span className="mr-1.5 tabular-nums text-ink-400">{i + 1}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section n={1} id="what" title="What it is">
        <p>
          A weekly candidate outreach pipeline for a busy founder who wants a fresh shortlist every week — but doesn't yet
          know which skills and backgrounds actually predict a great hire.
        </p>
        <p>
          The demo is set at <strong className="text-ink-900">{COMPANY.name}</strong>, {COMPANY.blurb}, hiring for five
          roles. The company, the candidates and all activity are fictional.
        </p>
      </Section>

      <Section n={2} id="idea" title="The idea">
        <p>
          Every criterion is a <strong className="text-ink-900">hypothesis</strong>: “people with this background turn out
          to be strong hires”. A simple weekly loop tests each one:
        </p>
        <ol className="space-y-2">
          {LOOP.map(([step, line], i) => (
            <li key={step} className="flex gap-3">
              <span className="w-6 shrink-0 tabular-nums text-ink-400">{i + 1}.</span>
              <span>
                <strong className="font-semibold text-ink-900">{step}</strong> — {line}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section n={3} id="scoring" title="How scoring works">
        <p>
          <strong className="text-ink-900">Fit</strong> is the weighted average of the ratings we have. Missing evidence is
          left out — never counted as zero — because “not checked” isn't “can't”.
        </p>
        <p>
          <strong className="text-ink-900">Cautious fit</strong> is what we rank by: the unknown part of a profile counts as
          neutral (50), so a thin profile with two great ratings can't jump to the top.
        </p>
        <p>
          <strong className="text-ink-900">Confidence</strong> says how much to trust a score: how much is evidenced, how
          strongly, and whether a person (and later a coffee chat) confirmed it.
        </p>
        <p>
          <strong className="text-ink-900">Evidence matching</strong> on Sourcing compares each sentence of a pasted profile
          with each criterion using a small sentence-embedding model in your browser. It only suggests; a person confirms.
        </p>
        <p>
          <HowItWorksLink label="Formulas and a live example" className={`inline-flex items-center gap-1.5 font-medium ${link}`} />
        </p>
      </Section>

      <Section n={4} id="manual" title="User manual">
        <Manual title="Roles & Criteria" to="/roles">
          <li>Pick a role at the top, or create one with New role — it starts with the three company-wide qualities.</li>
          <li>Drag a weight slider — the others rebalance so the total stays 100.</li>
          <li>Add, rename (pencil) or remove (bin) criteria. Delete role removes a role you created.</li>
          <li>See every change, with time, under History.</li>
        </Manual>
        <Manual title="Sourcing" to="/sourcing">
          <li>Pick a search type — Broad, Precise or Unconventional builders — and edit it if you like.</li>
          <li>Open in LinkedIn runs the search in a new tab; you browse LinkedIn yourself. Save keeps the search.</li>
          <li>Paste a profile you like (or Try an example) and choose Match evidence.</li>
          <li>Check each suggested line — strong, weak or missing — then Confirm & save.</li>
          <li>Saved searches show how many people each one found, shortlisted, met and progressed.</li>
        </Manual>
        <Manual title="Candidates" to="/candidates">
          <li>The list is ranked live; rows that move are highlighted.</li>
          <li>Switch between Cautious (default) and Raw fit; filter by fit, confidence and source.</li>
          <li>Click a person for evidence, must-haves and what to ask about.</li>
          <li>Contact opens an outreach draft — never sent automatically.</li>
        </Manual>
        <Manual title="Pipeline" to="/pipeline">
          <li>Generate shortlist adds the top new candidates to Suggested.</li>
          <li>Review shortlist opens the swipe review in the app.</li>
          <li>Move people along the board with the buttons on each card; Draft outreach cites their strongest evidence.</li>
          <li>Results by source compares direct sourcing with agencies; Weekly rhythm shows who does what.</li>
        </Manual>
        <Manual title="Founder review">
          <li>After Generate shortlist, choose Copy link for CEO.</li>
          <li>They swipe on any phone: right to approve, left to skip (one-tap reason), star for priority. Undo is always there.</li>
          <li>Send decisions back copies a results link; open it in the app and confirm the import.</li>
        </Manual>
        <Manual title="Learning" to="/learning">
          <li>Log feedback for each finished chat: outcome, what you saw, one line.</li>
          <li>Read the hypothesis check: which criteria are holding up, unclear or not supported.</li>
          <li>Accept or dismiss the suggested weight change.</li>
        </Manual>
        <Manual title="Reset demo">
          <li>Reset demo (bottom of the sidebar) restores the original data and removes roles and profiles you added.</li>
        </Manual>
      </Section>

      <Section n={5} id="privacy" title="Privacy and fairness">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>All candidates and activity are fictional.</li>
          <li>Everything you do stays in your browser. There is no server and no account.</li>
          <li>Share links contain IDs only — never names or evidence.</li>
          <li>No protected characteristics (photos, age, gender, nationality) are stored or used.</li>
          <li>Scores support a human decision; they never make one. Nobody is contacted or rejected automatically.</li>
          <li>No automated LinkedIn access, scraping or login. Pasted profiles are matched on your device; only lines you confirm are kept.</li>
          <li>The live site uses Vercel Web Analytics for anonymous page-view counts (no cookies). No candidate data is sent.</li>
        </ul>
      </Section>

      <Section n={6} id="built" title="How it was built">
        <p>
          Designed and directed by Sijia He using AI-assisted development with Claude Code. Delivered in reviewed phases —
          scoring, ranking, pipeline, learning, sourcing, then polish and an accessibility audit — with about 100 automated
          tests. React, TypeScript, Tailwind CSS and Vite, deployed on Vercel.
        </p>
      </Section>

      <Section n={7} id="limits" title="Limits, and what production would need">
        <p>This is a demo: data lives in one browser and samples are tiny. A production version would need:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>A shared database with login, so the founder and team see the same pipeline.</li>
          <li>A connection to your applicant tracking system (ATS) for the formal process.</li>
          <li>LinkedIn Recruiter or other approved sourcing tools.</li>
          <li>Months of real chat history, so the learning has enough data.</li>
          <li>A privacy review before any real candidate data is used.</li>
        </ol>
      </Section>

      <Section n={8} id="credits" title="Credits and contact">
        <p>
          Evidence matching runs <Ext href="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2</Ext>{' '}
          (Apache 2.0) in the browser with <Ext href="https://huggingface.co/docs/transformers.js">Transformers.js</Ext> (Apache
          2.0) and <Ext href="https://github.com/microsoft/onnxruntime">ONNX Runtime Web</Ext> (MIT). Font: Inter (OFL 1.1).
        </p>
        <p className="text-sm text-ink-500">
          Licences: <a className="underline underline-offset-4" href="/licenses/all-MiniLM-L6-v2-Apache-2.0.txt">model</a> ·{' '}
          <a className="underline underline-offset-4" href="/licenses/transformers.js-Apache-2.0.txt">Transformers.js</a> ·{' '}
          <a className="underline underline-offset-4" href="/licenses/onnxruntime-MIT.txt">ONNX Runtime</a> ·{' '}
          <a className="underline underline-offset-4" href="/licenses/inter-OFL-1.1.txt">font</a>
        </p>
        <p>
          Sijia He · <a href={CONTACT_HREF} className={link}>{CONTACT_EMAIL}</a>
        </p>
      </Section>
    </article>
  );
}

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tightish text-ink-900">
        <span className="mr-2 text-ink-400">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
    </a>
  );
}

function Manual({ title, to, children }: { title: string; to?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-5">
      <h3 className="mb-2 font-semibold text-ink-900">
        {to ? (
          <Link to={to} className="hover:underline">
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <ol className="list-decimal space-y-1 pl-5">{children}</ol>
    </div>
  );
}
