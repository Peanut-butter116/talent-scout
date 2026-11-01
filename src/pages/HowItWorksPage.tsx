import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ExternalLink, Minus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HypothesisChip, StrengthChip } from '../components/Chips';
import { DemoBadge } from '../components/DemoBadge';
import {
  HIGH_PREDICTED_THRESHOLD,
  HOLDING_UP_DIFF,
  MIN_GROUP_SIZE,
  MIN_SUGGESTED_WEIGHT,
  OVERSTATED_GAP,
} from '../lib/analysis';
import { NEEDS_EVIDENCE_COVERAGE, rankCandidates, roleAverageFit } from '../lib/scoring';
import { setWeight } from '../lib/weights';
import { useAppState } from '../state/AppState';
import type { Criterion } from '../types';

const SECTIONS = [
  { id: 'big-idea', title: 'The big idea' },
  { id: 'evidence', title: 'Evidence ratings' },
  { id: 'fit', title: 'Fit score' },
  { id: 'cautious', title: 'Cautious fit (the ranking)' },
  { id: 'confidence', title: 'Confidence' },
  { id: 'example', title: 'How weights affect ranking — live' },
  { id: 'learning', title: 'Learning from coffee chats' },
  { id: 'matching', title: 'Evidence matching model' },
  { id: 'limits', title: 'Limits and human oversight' },
  { id: 'sources', title: 'Sources' },
];

const SOURCES = [
  { label: 'all-MiniLM-L6-v2 model card', href: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2' },
  { label: 'Browser version used', href: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2' },
  { label: 'Sentence-Transformers docs', href: 'https://www.sbert.net' },
  { label: 'Transformers.js docs', href: 'https://huggingface.co/docs/transformers.js' },
];

export function HowItWorksPage() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <article className="mx-auto max-w-3xl">
      <Link to={from ?? '/roles'} className="btn-ghost -ml-3 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> {from ? 'Back' : 'Back to the app'}
      </Link>
      <DemoBadge className="mb-2" />
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">How ranking works</h1>
      <p className="mt-2 text-slate-600">
        Plain-English notes on every number in Talent Scout. Nothing here is a black box: it's a handful of simple rules,
        and a human makes every decision.
      </p>

      <nav className="card mt-6 p-4" aria-label="On this page">
        <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-navy-700 hover:text-teal-700">
                <span className="mr-1.5 tabular-nums text-slate-400">{i + 1}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section n={1} id="big-idea" title="The big idea">
        <p>
          Every hiring criterion is a <strong>hypothesis</strong>: “people with this background turn out to be strong hires”.
          We score candidates against weighted criteria, meet the best in coffee chats, and record what we saw. Over time the
          chats show which hypotheses hold up, and the weights shift towards what actually predicts a good hire.
        </p>
        <LoopDiagram />
      </Section>

      <Section n={2} id="evidence" title="Evidence ratings">
        <p>For each criterion, a candidate has either:</p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex flex-wrap items-center gap-2">
            <StrengthChip strength="strong" /> a 0–5 rating backed by something concrete (a shipped product, a number, a link).
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <StrengthChip strength="weak" /> a 0–5 rating based on a claim or second-hand signal.
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <StrengthChip strength="missing" /> nothing yet — we simply don't know.
          </li>
        </ul>
        <p className="mt-3">
          Where ratings come from: in this demo they were entered by a person. On the Sourcing page, an on-device matching
          model will <em>suggest</em> evidence from text you paste — and a person always confirms or edits it before it counts.
        </p>
      </Section>

      <Section n={3} id="fit" title="Fit score">
        <p>A weighted average of the ratings we have, shown as 0–100%:</p>
        <Formula>fit = Σ (weight × rating) ÷ (5 × Σ weight of evidenced criteria)</Formula>
        <p>
          Weights are <strong>re-normalised</strong> over the criteria that have evidence. So a missing criterion is left
          out — it is never treated as a zero. That's deliberate: “we haven't checked” is not the same as “they can't”. Missing
          evidence lowers <em>confidence</em> and <em>coverage</em> instead.
        </p>
      </Section>

      <Section n={4} id="cautious" title="Cautious fit (the ranking)">
        <p>
          Fit alone lets a thin profile with two great ratings sit at the top of the list. So we rank by <strong>cautious
          fit</strong>, which pulls a score towards the role's average in proportion to how much is unknown:
        </p>
        <Formula>cautious fit = coverage × fit + (1 − coverage) × role average fit</Formula>
        <p>
          <em>Coverage</em> is the share of total weight that has evidence. With full evidence, cautious fit equals fit. With
          little evidence, it sits near the average until we learn more. Below {NEEDS_EVIDENCE_COVERAGE}% coverage, a
          candidate is tagged <strong>“Needs more evidence”</strong> with the suggestion to find out more before contacting.
          You can switch the Candidates table to “Raw fit” at any time.
        </p>
      </Section>

      <Section n={5} id="confidence" title="Confidence">
        <p>How much to trust the score, not how good the candidate is.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>High</strong> — at least 80% of the weight evidenced, and at least 60% of that by strong evidence.</li>
          <li><strong>Low</strong> — under 50% evidenced, or less than 30% strong.</li>
          <li><strong>Medium</strong> — everything in between.</li>
        </ul>
        <p className="mt-3 text-sm text-slate-500">
          Coming in the Sourcing step: confidence becomes a single transparent formula — coverage × quality (strong vs weak)
          × verification (confirmed by a person, then by a coffee chat) — giving a 0–100 score and the same three labels.
        </p>
      </Section>

      <Section n={6} id="example" title="How weights affect ranking — live">
        <LiveExample />
      </Section>

      <Section n={7} id="learning" title="Learning from coffee chats">
        <p>
          After each chat, the CEO logs an outcome — Progress (1), Maybe (0.5) or Not a fit (0) — and optionally what they
          observed per criterion. For each criterion we then compare candidates whose profiles rated them high (≥{' '}
          {HIGH_PREDICTED_THRESHOLD}) with those rated lower:
        </p>
        <ul className="mt-3 space-y-2">
          <li className="flex flex-wrap items-center gap-2">
            <HypothesisChip label="Not tested yet" /> fewer than 2 chats with a profile rating for it.
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <HypothesisChip label="Holding up" /> high-rated candidates did at least {Math.round(HOLDING_UP_DIFF * 100)} points better.
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <HypothesisChip label="Not supported" /> high-rated candidates did no better (or worse).
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <HypothesisChip label="Unclear" /> a small or mixed difference, or fewer than {MIN_GROUP_SIZE} chats on either side.
          </li>
        </ul>
        <p className="mt-3">
          Qualities every role shares (Builder, Sharp & curious, Low ego) and pedigree-style criteria are pooled across roles,
          so they get tested sooner. If profiles rated a criterion {OVERSTATED_GAP}+ points higher than chats did, on average,
          it's flagged as “profiles overstated”.
        </p>
        <p className="mt-3">
          <strong>Suggested weight change:</strong> take weight from the least-supported criterion (halved, never below{' '}
          {MIN_SUGGESTED_WEIGHT}) and give it to the best-supported one. A person accepts or dismisses it; accepted changes are
          logged in Weight history.
        </p>
      </Section>

      <Section n={8} id="matching" title="Evidence matching model">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-navy-800">Coming in the Sourcing step</p>
          <p className="mt-1">
            This section will explain how pasted profile text is matched to criteria on your device, and what the match
            scores mean.
          </p>
        </div>
      </Section>

      <Section n={9} id="limits" title="Limits and human oversight">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Scores support a human decision; they never make it. Nobody is contacted or rejected automatically.</li>
          <li>Text similarity measures relevance, not ability. A well-written profile is not a better engineer.</li>
          <li>Samples are small. Learning results are indicative only, and a person decides what to change.</li>
          <li>No protected characteristics are stored or used — no photos, ages, gender or nationality.</li>
          <li>All candidates and activity in this demo are fictional.</li>
        </ul>
      </Section>

      <Section n={10} id="sources" title="Sources">
        <ul className="space-y-2">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800">
                {s.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-slate-200 pt-8 mt-8 text-[15px] leading-relaxed text-slate-700">
      <h2 className="mb-3 text-lg font-semibold text-navy-900">
        <span className="mr-2 text-slate-400">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg bg-navy-900 px-4 py-3 font-mono text-[13px] text-teal-100">
      {children}
    </div>
  );
}

function LoopDiagram() {
  const steps = ['Criteria = hypotheses', 'Score & rank', 'Weekly shortlist', 'Coffee chats', 'Feedback & learning'];
  return (
    <figure className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-label="The weekly learning loop">
      <ol className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-1">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-col items-center gap-2 sm:flex-1 sm:flex-row sm:gap-1">
            <div className="w-full rounded-lg bg-teal-50 px-3 py-2 text-center text-sm font-medium text-teal-900 ring-1 ring-teal-100">
              {s}
            </div>
            {i < steps.length - 1 && (
              <>
                <ArrowDown className="h-4 w-4 shrink-0 text-slate-400 sm:hidden" aria-hidden />
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
              </>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Feedback updates the weights, and the loop runs again next week.
      </figcaption>
    </figure>
  );
}

/** Recalculates with the app's own scoring functions on a local copy of the weights. */
function LiveExample() {
  const { state } = useAppState();
  const [roleId, setRoleId] = useState(state.selectedRoleId);
  const baseRole = state.roles.find((r) => r.id === roleId) ?? state.roles[0];
  const [criteria, setCriteria] = useState<Criterion[]>(baseRole.criteria);
  const [sliderId, setSliderId] = useState(baseRole.criteria[0]?.id ?? '');
  const baseRanked = useMemo(() => rankCandidates(state.candidates, baseRole), [state.candidates, baseRole]);
  const [candidateId, setCandidateId] = useState(baseRanked[0]?.candidate.id ?? '');

  useEffect(() => {
    setCriteria(baseRole.criteria);
    setSliderId(baseRole.criteria[0]?.id ?? '');
    setCandidateId(rankCandidates(state.candidates, baseRole)[0]?.candidate.id ?? '');
    // Reset only when the chosen role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const role = useMemo(() => ({ ...baseRole, criteria }), [baseRole, criteria]);
  const ranked = useMemo(() => rankCandidates(state.candidates, role), [state.candidates, role]);
  const item = ranked.find((r) => r.candidate.id === candidateId);
  const before = baseRanked.find((r) => r.candidate.id === candidateId);
  const avg = roleAverageFit(ranked.map((r) => r.score));
  const slider = criteria.find((c) => c.id === sliderId);
  const changed = criteria.some((c, i) => c.weight !== baseRole.criteria[i]?.weight);

  if (!item || !before) {
    return <p className="text-sm text-slate-500">No candidates for this role yet.</p>;
  }

  const c = item.candidate;
  const evidenced = criteria.filter((cr) => c.evidence[cr.id]);
  const sumW = evidenced.reduce((a, cr) => a + cr.weight, 0);
  const sumWR = evidenced.reduce((a, cr) => a + cr.weight * c.evidence[cr.id]!.rating, 0);
  const rankDelta = before.rank - item.rank;

  return (
    <div>
      <p>
        Pick a role and a candidate. Moving the slider changes the weights <strong>only on this page</strong> — your real
        rubric isn't touched.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Role</span>
          <select className="input" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {state.roles.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Candidate</span>
          <select className="input" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
            {baseRanked.map((r) => (
              <option key={r.candidate.id} value={r.candidate.id}>#{r.rank} {r.candidate.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Criterion</th>
              <th className="px-3 py-2 text-right font-medium">Weight</th>
              <th className="px-3 py-2 text-right font-medium">Rating</th>
              <th className="px-3 py-2 text-right font-medium">W × R</th>
              <th className="px-3 py-2 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criteria.map((cr) => {
              const e = c.evidence[cr.id];
              return (
                <tr key={cr.id} className={cr.id === sliderId ? 'bg-teal-50/50' : ''}>
                  <td className="px-3 py-2 text-navy-900">{cr.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{cr.weight}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{e ? e.rating : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{e ? cr.weight * e.rating : <span className="text-slate-400">left out</span>}</td>
                  <td className="px-3 py-2"><StrengthChip strength={e ? e.strength : 'missing'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Formula>
        fit = {sumWR} ÷ (5 × {sumW}) = {item.score.fit === null ? '—' : `${item.score.fit.toFixed(1)}%`}
        <br />
        cautious = {(item.score.coverage / 100).toFixed(2)} × {item.score.fit?.toFixed(1) ?? 0} + {(1 - item.score.coverage / 100).toFixed(2)} × {avg.toFixed(1)} = {item.cautiousFit.toFixed(1)}%
      </Formula>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Fit" value={item.score.fit === null ? '—' : `${Math.round(item.score.fit)}%`} />
        <Stat label="Coverage" value={`${Math.round(item.score.coverage)}%`} />
        <Stat label="Cautious fit" value={`${Math.round(item.cautiousFit)}%`} />
        <Stat
          label="Rank"
          value={
            <span className="inline-flex items-center gap-1.5">
              #{item.rank}
              {rankDelta > 0 && <span className="inline-flex items-center text-sm text-teal-700"><ArrowUp className="h-3.5 w-3.5" />{rankDelta}</span>}
              {rankDelta < 0 && <span className="inline-flex items-center text-sm text-rose-600"><ArrowDown className="h-3.5 w-3.5" />{-rankDelta}</span>}
              {rankDelta === 0 && changed && <Minus className="h-3.5 w-3.5 text-slate-400" />}
            </span>
          }
          sub={changed ? `was #${before.rank} of ${baseRanked.length}` : `of ${baseRanked.length}`}
        />
      </div>

      {slider && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm sm:w-1/2">
              <span className="mb-1 block text-xs font-medium text-slate-500">Try changing a weight</span>
              <select className="input" value={sliderId} onChange={(e) => setSliderId(e.target.value)}>
                {criteria.map((cr) => (
                  <option key={cr.id} value={cr.id}>{cr.name}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-1 items-center gap-3 sm:pt-5">
              <input
                type="range"
                min={0}
                max={100}
                value={slider.weight}
                onChange={(e) => setCriteria((cs) => setWeight(cs, sliderId, Number(e.target.value)))}
                className="h-2 w-full accent-teal-600"
                aria-label={`Example weight for ${slider.name}`}
              />
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{slider.weight}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Other weights rebalance so the total stays 100.</span>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setCriteria(baseRole.criteria)} disabled={!changed}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset example
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums text-navy-900">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
