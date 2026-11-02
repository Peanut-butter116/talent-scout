import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ExternalLink, Minus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HypothesisChip, StrengthChip } from '../components/Chips';
import {
  HIGH_PREDICTED_THRESHOLD,
  HOLDING_UP_DIFF,
  MIN_GROUP_SIZE,
  MIN_SUGGESTED_WEIGHT,
} from '../lib/analysis';
import { KEYWORD_THRESHOLDS, MODEL_MIX, MODEL_THRESHOLDS } from '../lib/extract';
import { CONFIDENCE_BANDS, NEEDS_EVIDENCE_COVERAGE, NEUTRAL_FIT, QUALITY_WEIGHT, rankCandidates, VERIFICATION_WEIGHT } from '../lib/scoring';
import { setWeight } from '../lib/weights';
import { useAppState } from '../state/AppState';
import type { Criterion } from '../types';

const SECTIONS = [
  { id: 'big-idea', title: 'The big idea' },
  { id: 'evidence', title: 'Evidence' },
  { id: 'fit', title: 'Fit' },
  { id: 'cautious', title: 'Ranking' },
  { id: 'confidence', title: 'Confidence' },
  { id: 'example', title: 'Try it' },
  { id: 'learning', title: 'Learning' },
  { id: 'matching', title: 'Matching model' },
  { id: 'limits', title: 'Limits' },
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
    <article className="mx-auto max-w-2xl">
      <Link to={from ?? '/roles'} className="btn-ghost -ml-4 mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">How it works</h1>
      <p className="mt-2 text-[15px] text-ink-500">A few simple rules. A person makes every decision.</p>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="On this page">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-ink-500 hover:text-ink-900">
            {s.title}
          </a>
        ))}
      </nav>

      <Section n={1} id="big-idea" title="The big idea">
        <p>Every criterion is a hypothesis. Coffee chats test it. The rubric updates.</p>
        <LoopDiagram />
      </Section>

      <Section n={2} id="evidence" title="Evidence">
        <p>Each criterion gets a 0–5 rating, or nothing yet.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StrengthChip strength="strong" />
          <StrengthChip strength="weak" />
          <StrengthChip strength="missing" />
        </div>
        <p className="mt-3">Entered by a person. In Sourcing, a matching model suggests — a person confirms.</p>
      </Section>

      <Section n={3} id="fit" title="Fit">
        <Formula>fit = Σ (weight × rating) ÷ (5 × Σ weight with evidence)</Formula>
        <p>Missing ratings are left out, never counted as zero. “Not checked” isn't “can't”.</p>
      </Section>

      <Section n={4} id="cautious" title="Ranking (cautious fit)">
        <Formula>cautious = coverage × fit + (1 − coverage) × {NEUTRAL_FIT}</Formula>
        <p>
          Unknowns count as neutral, so thin profiles can't top the list. Under {NEEDS_EVIDENCE_COVERAGE}% coverage:
          “Needs more evidence”.
        </p>
      </Section>

      <Section n={5} id="confidence" title="Confidence">
        <p>How much to trust the score — not how good the person is.</p>
        <Formula>confidence = coverage × quality × verification</Formula>
        <ul className="space-y-1 text-ink-500">
          <li>Coverage: share of the weight with evidence.</li>
          <li>Quality: strong {QUALITY_WEIGHT.strong} · weak {QUALITY_WEIGHT.weak}.</li>
          <li>Verification: confirmed by a person {VERIFICATION_WEIGHT.person} · also seen in a coffee chat {VERIFICATION_WEIGHT.chat}.</li>
          <li>High ≥ {CONFIDENCE_BANDS.high} · Medium ≥ {CONFIDENCE_BANDS.medium} · Low below.</li>
        </ul>
      </Section>

      <Section n={6} id="example" title="Try it">
        <LiveExample />
      </Section>

      <Section n={7} id="learning" title="Learning">
        <p>
          Outcomes: Progress 1 · Maybe 0.5 · Not a fit 0. Compare people rated high (≥ {HIGH_PREDICTED_THRESHOLD}) with
          the rest.
        </p>
        <ul className="mt-3 space-y-2">
          <li className="flex flex-wrap items-center gap-2"><HypothesisChip label="Holding up" /> high did {Math.round(HOLDING_UP_DIFF * 100)}+ points better</li>
          <li className="flex flex-wrap items-center gap-2"><HypothesisChip label="Not supported" /> high did no better</li>
          <li className="flex flex-wrap items-center gap-2"><HypothesisChip label="Unclear" /> small gap, or under {MIN_GROUP_SIZE} chats a side</li>
          <li className="flex flex-wrap items-center gap-2"><HypothesisChip label="Not tested yet" /> under 2 chats</li>
        </ul>
        <p className="mt-3">Suggestion: halve the weakest (min {MIN_SUGGESTED_WEIGHT}), give it to the strongest. You decide.</p>
      </Section>

      <Section n={8} id="matching" title="Matching model">
        <p>When you paste a profile on Sourcing, a small model suggests evidence for each criterion. You confirm it.</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>The text is split into sentences.</li>
          <li>Each sentence becomes a list of numbers (a sentence embedding) that captures its meaning.</li>
          <li>So does each criterion's description and example phrases.</li>
          <li>Cosine similarity measures how close they are: 1 = same meaning, 0 = unrelated.</li>
        </ol>
        <Formula>
          score = {MODEL_MIX.cosine} × best cosine + {MODEL_MIX.keywords} × keyword overlap
        </Formula>
        <p>
          Strong ≥ {MODEL_THRESHOLDS.strong} · weak ≥ {MODEL_THRESHOLDS.weak} · below that, missing. The rating starts at 3
          (strong) or 2 (weak), +1 for a doing verb (built, shipped, led), +1 for a number.
        </p>
        <p className="mt-3">
          If the model can't load, keyword matching takes over (strong ≥ {KEYWORD_THRESHOLDS.strong}, weak ≥{' '}
          {KEYWORD_THRESHOLDS.weak}).
        </p>
        <p className="mt-3 text-ink-500">
          Runs entirely in your browser (all-MiniLM-L6-v2, quantized, ~23 MB, loaded once from this site). Nothing is
          uploaded; only the lines you confirm are kept.
        </p>
      </Section>

      <Section n={9} id="limits" title="Limits">
        <ul className="space-y-1.5">
          <li>Scores support a decision; they never make it.</li>
          <li>Similarity measures relevance, not ability.</li>
          <li>Small samples — a guide, not proof.</li>
          <li>No protected characteristics are used.</li>
        </ul>
      </Section>

      <Section n={10} id="sources" title="Sources">
        <ul className="space-y-2">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
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
    <section id={id} className="mt-14 scroll-mt-24 text-[15px] leading-relaxed text-ink-700">
      <h2 className="mb-3 text-xl font-semibold text-ink-900">
        <span className="mr-2 text-ink-400">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return <div className="my-3 overflow-x-auto rounded-2xl bg-ink-50 px-4 py-3 font-mono text-[13px] text-ink-800">{children}</div>;
}

function LoopDiagram() {
  const steps = ['Criteria', 'Rank', 'Shortlist', 'Coffee chats', 'Learn'];
  return (
    <figure className="mt-5" aria-label="The weekly learning loop">
      <ol className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
            <span className="rounded-full bg-ink-50 px-4 py-2 text-sm font-medium text-ink-800">{s}</span>
            {i < steps.length - 1 && (
              <>
                <ArrowDown className="h-4 w-4 text-ink-300 sm:hidden" aria-hidden />
                <ArrowRight className="hidden h-4 w-4 text-ink-300 sm:block" aria-hidden />
              </>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400 sm:justify-start">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Weights update, repeat weekly.
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
  const slider = criteria.find((c) => c.id === sliderId);
  const changed = criteria.some((c, i) => c.weight !== baseRole.criteria[i]?.weight);

  if (!item || !before) return <p className="text-sm text-ink-400">No candidates for this role yet.</p>;

  const c = item.candidate;
  const evidenced = criteria.filter((cr) => c.evidence[cr.id]);
  const sumW = evidenced.reduce((a, cr) => a + cr.weight, 0);
  const sumWR = evidenced.reduce((a, cr) => a + cr.weight * c.evidence[cr.id]!.rating, 0);
  const rankDelta = before.rank - item.rank;
  const cov = item.score.coverage / 100;

  return (
    <div data-tour="live-example">
      <p className="text-ink-500">Changes here stay on this page.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <select className="input" value={roleId} onChange={(e) => setRoleId(e.target.value)} aria-label="Role">
          {state.roles.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <select className="input" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} aria-label="Candidate">
          {baseRanked.map((r) => (
            <option key={r.candidate.id} value={r.candidate.id}>#{r.rank} {r.candidate.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead className="text-left text-xs text-ink-400">
            <tr className="border-b border-ink-100">
              <th className="py-2 pr-2 font-medium">Criterion</th>
              <th className="py-2 pr-2 text-right font-medium">W</th>
              <th className="py-2 pr-2 text-right font-medium">R</th>
              <th className="py-2 pr-2 text-right font-medium">W×R</th>
              <th className="py-2 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {criteria.map((cr) => {
              const e = c.evidence[cr.id];
              return (
                <tr key={cr.id} className={cr.id === sliderId ? 'bg-ink-100' : ''}>
                  <td className="py-2 pr-2 text-ink-800">{cr.name}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{cr.weight}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{e ? e.rating : '—'}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{e ? cr.weight * e.rating : <span className="text-ink-300">—</span>}</td>
                  <td className="py-2"><StrengthChip strength={e ? e.strength : 'missing'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Formula>
        fit = {sumWR} ÷ (5 × {sumW}) = {item.score.fit === null ? '—' : `${item.score.fit.toFixed(1)}%`}
        <br />
        cautious = {cov.toFixed(2)} × {item.score.fit?.toFixed(1) ?? NEUTRAL_FIT} + {(1 - cov).toFixed(2)} × {NEUTRAL_FIT} = {item.cautiousFit.toFixed(1)}%
      </Formula>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Fit" value={item.score.fit === null ? '—' : `${Math.round(item.score.fit)}%`} />
        <Stat label="Coverage" value={`${Math.round(item.score.coverage)}%`} />
        <Stat label="Cautious" value={`${Math.round(item.cautiousFit)}%`} />
        <Stat
          label="Rank"
          value={
            <span className="inline-flex items-center gap-1.5">
              #{item.rank}
              {rankDelta > 0 && <span className="inline-flex items-center text-sm text-teal-700"><ArrowUp className="h-3.5 w-3.5" />{rankDelta}</span>}
              {rankDelta < 0 && <span className="inline-flex items-center text-sm text-rose-600"><ArrowDown className="h-3.5 w-3.5" />{-rankDelta}</span>}
              {rankDelta === 0 && changed && <Minus className="h-3.5 w-3.5 text-ink-300" />}
            </span>
          }
          sub={changed ? `was #${before.rank}` : `of ${baseRanked.length}`}
        />
      </dl>

      {slider && (
        <div className="mt-6 rounded-2xl bg-ink-50 p-4">
          <select className="input" value={sliderId} onChange={(e) => setSliderId(e.target.value)} aria-label="Criterion to change">
            {criteria.map((cr) => (
              <option key={cr.id} value={cr.id}>{cr.name}</option>
            ))}
          </select>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={slider.weight}
              onChange={(e) => setCriteria((cs) => setWeight(cs, sliderId, Number(e.target.value)))}
              className="h-1.5 w-full accent-ink-900"
              aria-label={`Example weight for ${slider.name}`}
            />
            <span className="w-8 text-right text-sm font-semibold tabular-nums">{slider.weight}</span>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setCriteria(baseRole.criteria)} disabled={!changed}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-ink-900">{value}</dd>
      {sub && <dd className="text-xs text-ink-400">{sub}</dd>}
    </div>
  );
}
