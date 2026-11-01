import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, CONTACT_HREF } from '../components/Disclaimer';
import { BuiltForGlot } from '../components/GlotLogo';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { useAppState } from '../state/AppState';

/**
 * README-style About page. The one exception to the short-copy rule — but kept scannable:
 * headings, short paragraphs, numbered steps, and a table of contents.
 * Keep README.md in the repo in sync with this page.
 */
const SECTIONS = [
  { id: 'what', title: 'What this is' },
  { id: 'problem', title: 'The problem' },
  { id: 'idea', title: 'The idea' },
  { id: 'scoring', title: 'How the scoring works' },
  { id: 'manual', title: 'User manual' },
  { id: 'rhythm', title: 'A suggested weekly rhythm' },
  { id: 'privacy', title: 'Privacy and fairness' },
  { id: 'limits', title: 'Limits, and what a real version needs' },
  { id: 'built', title: 'Built with' },
  { id: 'contact', title: 'Contact' },
];

const LOOP = [
  ['Define criteria', 'Write down what you think predicts a great hire, with weights.'],
  ['Rank candidates', 'Everyone is scored against those weights.'],
  ['CEO reviews shortlist', 'A few minutes of swiping: approve, skip or star.'],
  ['Outreach', 'Drafts are prepared; a person sends them.'],
  ['Coffee chat', 'The real test of each assumption.'],
  ['Log feedback', 'Outcome and what you saw, in about 30 seconds.'],
  ['Check which criteria hold up', 'Did high scorers actually do better in chats?'],
  ['Update weights', 'Accept or dismiss a suggested change.'],
  ["Next week's ranking", 'The loop runs again with sharper criteria.'],
];

export function AboutPage() {
  const { state } = useAppState();

  return (
    <article className="mx-auto max-w-2xl text-[15px] leading-relaxed text-ink-600">
      <BuiltForGlot size="md" />
      <h1 className="mt-4 text-[2rem] font-semibold leading-tight tracking-display text-ink-900 sm:text-[2.6rem]">
        About Talent Scout
      </h1>
      <p className="mt-2 text-ink-500">A weekly shortlist that learns what really predicts a great hire.</p>

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

      <Section n={1} id="what" title="What this is">
        <p>
          A working demo built by Sijia He in response to a question raised during her application for the Founder's EA
          role at Glot: <em>how do you produce a weekly shortlist of people to reach out to for open roles — and test which
          skills and backgrounds actually matter?</em>
        </p>
        <p>
          All candidates and activity are fictional. The roles and criteria are based on Glot's public job ads:
        </p>
        <ul className="space-y-1">
          {state.roles.map((r) => (
            <li key={r.id}>
              {r.jdUrl ? (
                <a href={r.jdUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
                  {r.title} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : (
                r.title
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-400">Not an official Glot product.</p>
      </Section>

      <Section n={2} id="problem" title="The problem">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The CEO wants a fresh shortlist every week, but doesn't have time to build one.</li>
          <li>It isn't yet clear which skills and backgrounds predict a good hire.</li>
          <li>Coffee chats are the real test — but what they teach is rarely written down.</li>
          <li>When an assumption doesn't hold, the criteria need to be easy to change.</li>
        </ul>
      </Section>

      <Section n={3} id="idea" title="The idea">
        <p>
          Every criterion is a <strong className="text-ink-900">hypothesis</strong>: “people with this background turn out
          to be strong hires”. The app runs a simple weekly loop that tests each one:
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

      <Section n={4} id="scoring" title="How the scoring works">
        <p>
          <strong className="text-ink-900">Fit</strong> is the weighted average of the ratings we have. A criterion with no
          evidence is left out — never counted as zero — because “not checked” isn't “can't”.
        </p>
        <p>
          <strong className="text-ink-900">Cautious fit</strong> is what we rank by. It treats the unknown part of a profile
          as neutral (50), so a thin profile with two great ratings can't jump to the top. With full evidence, cautious fit
          equals fit.
        </p>
        <p>
          <strong className="text-ink-900">Confidence</strong> says how much to trust a score — not how good the person is.
          It multiplies how much of the profile is evidenced, how strong that evidence is, and whether a person (and later a
          coffee chat) confirmed it.
        </p>
        <p>
          <strong className="text-ink-900">Evidence matching</strong> (Sourcing) compares each sentence of a pasted profile
          with each criterion's description and examples, using a small sentence-embedding model in your browser. It only
          suggests; a person confirms every line.
        </p>
        <p>
          <HowItWorksLink label="Formulas and a live example" className="inline-flex items-center gap-1.5 font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900" />
        </p>
      </Section>

      <Section n={5} id="manual" title="User manual">
        <Manual title="Roles & Criteria" to="/roles">
          <li>Pick a role at the top.</li>
          <li>Drag a weight slider — the others rebalance so the total stays 100.</li>
          <li>Add, rename (pencil) or remove (bin) criteria.</li>
          <li>See every change, with time, under History.</li>
          <li>Open the job description from the link under the role summary.</li>
        </Manual>
        <Manual title="Candidates" to="/candidates">
          <li>The list is ranked live; rows that move are highlighted.</li>
          <li>Switch between Cautious (default) and Raw fit.</li>
          <li>Filter by fit, confidence and source.</li>
          <li>Click a person for evidence, must-haves and what to ask about.</li>
          <li>Use Contact to open an outreach draft (never sent automatically).</li>
        </Manual>
        <Manual title="Pipeline" to="/pipeline">
          <li>Generate shortlist adds the top new candidates to Suggested.</li>
          <li>Review shortlist opens the swipe review in the app.</li>
          <li>Move people along the board with the buttons on each card.</li>
          <li>Draft outreach prepares a message that cites their strongest evidence.</li>
          <li>Results by source compares direct sourcing with agencies.</li>
          <li>Weekly rhythm shows who does what, and when.</li>
        </Manual>
        <Manual title="CEO review">
          <li>After Generate shortlist, choose Copy link for CEO.</li>
          <li>The CEO opens it on any phone: swipe right to approve, left to skip (one-tap reason), star for priority. Undo is always there.</li>
          <li>At the end, Send decisions back copies a results link.</li>
          <li>Open that link in the app and confirm Import decisions. In the same browser, decisions apply straight away.</li>
        </Manual>
        <Manual title="Learning" to="/learning">
          <li>Log feedback for each finished chat: outcome, what you saw, one line.</li>
          <li>Read the hypothesis check: which criteria are holding up, unclear or not supported.</li>
          <li>Accept or dismiss the suggested weight change.</li>
        </Manual>
        <Manual title="Sourcing" to="/sourcing">
          <li>Pick a role and a search type: Broad, Precise or Unconventional builders. Edit the text if you like.</li>
          <li>Open in LinkedIn runs the search in a new tab — you browse LinkedIn yourself. Save keeps the search.</li>
          <li>Paste a profile or CV you like (or Try an example), add the profile link if you have it, and choose Match evidence.</li>
          <li>An on-device model suggests strong, weak or missing evidence per criterion. Check and edit each line.</li>
          <li>Confirm & save adds the person to Candidates, ranked like everyone else. Delete removes them.</li>
          <li>Saved searches show how many people each search found, shortlisted, met and progressed.</li>
        </Manual>
        <Manual title="Reset demo">
          <li>Reset demo (bottom of the sidebar) restores the original data.</li>
        </Manual>
      </Section>

      <Section n={6} id="rhythm" title="A suggested weekly rhythm">
        <ol className="space-y-2">
          <li><strong className="text-ink-900">Monday</strong> — EA sources and scores candidates (~1 hour).</li>
          <li><strong className="text-ink-900">Tuesday</strong> — CEO reviews the shortlist on their phone (~10 minutes).</li>
          <li><strong className="text-ink-900">Wednesday–Thursday</strong> — EA sends outreach and books coffee chats.</li>
          <li><strong className="text-ink-900">Friday</strong> — CEO logs chat feedback (~30 seconds each); EA reviews suggested weight changes.</li>
        </ol>
      </Section>

      <Section n={7} id="privacy" title="Privacy and fairness">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>All candidates in this demo are fictional.</li>
          <li>Everything stays in your browser. There is no server, no account and no tracking.</li>
          <li>Share links contain IDs only — never names or evidence.</li>
          <li>No protected characteristics (photos, age, gender, nationality) are stored or used.</li>
          <li>Scores support a human decision; they never make one. Nobody is contacted or rejected automatically.</li>
          <li>No automated LinkedIn access, scraping or login. Profiles you paste are matched on your device; only the lines you confirm are kept, in your browser, until you delete them or reset.</li>
        </ul>
      </Section>

      <Section n={8} id="limits" title="Limits, and what a real version needs">
        <p>This is a demo: data lives in one browser and samples are tiny. A real version would need:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>A shared database with login, so the CEO and EA see the same pipeline.</li>
          <li>A connection to Ashby, so approved people flow into the formal process.</li>
          <li>LinkedIn Recruiter or other approved sourcing tools.</li>
          <li>Real chat history over months, so the learning has enough data.</li>
          <li>A privacy review before any real candidate data is used.</li>
        </ol>
      </Section>

      <Section n={9} id="built" title="Built with">
        <p>React, TypeScript, Tailwind CSS and Vite, deployed on Vercel. Developed with Claude Code.</p>
        <p>
          Evidence matching runs{' '}
          <Ext href="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2</Ext> (Apache 2.0) in your
          browser with <Ext href="https://huggingface.co/docs/transformers.js">Transformers.js</Ext> (Apache 2.0) and{' '}
          <Ext href="https://github.com/microsoft/onnxruntime">ONNX Runtime Web</Ext> (MIT). Font: Plus Jakarta Sans (OFL 1.1).
        </p>
        <p className="text-sm text-ink-500">
          Licences:{' '}
          <a className="underline underline-offset-4" href="/licenses/all-MiniLM-L6-v2-Apache-2.0.txt">model</a> ·{' '}
          <a className="underline underline-offset-4" href="/licenses/transformers.js-Apache-2.0.txt">Transformers.js</a> ·{' '}
          <a className="underline underline-offset-4" href="/licenses/onnxruntime-MIT.txt">ONNX Runtime</a> ·{' '}
          <a className="underline underline-offset-4" href="/licenses/plus-jakarta-sans-OFL-1.1.txt">font</a>
        </p>
      </Section>

      <Section n={10} id="contact" title="Contact">
        <p>
          Sijia He ·{' '}
          <a href={CONTACT_HREF} className="text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
            {CONTACT_EMAIL}
          </a>
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
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
