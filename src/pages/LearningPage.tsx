import {
  ArrowRight,
  Check,
  Coffee,
  Info,
  Lightbulb,
  MessageSquareText,
  Pencil,
  ScanEye,
  SkipForward,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HypothesisChip } from '../components/Chips';
import { EmptyState } from '../components/EmptyState';
import { FeedbackForm } from '../components/FeedbackForm';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { PageHeader } from '../components/PageHeader';
import { RoleSelector } from '../components/RoleSelector';
import { formatTime } from '../components/WeightHistory';
import {
  HIGH_PREDICTED_THRESHOLD,
  overstatedCriteria,
  shortName,
  skipSignal,
  suggestRubricChange,
  type CriterionAnalysis,
  type HypothesisLabel,
} from '../lib/analysis';
import { skipReasonCounts } from '../lib/pipeline';
import { useAppState, useSelectedRole } from '../state/AppState';
import { useRanked, useRoleAnalysis } from '../state/hooks';
import { rememberIfUnseen } from '../state/rankMemory';
import { OUTCOME_LABEL, SKIP_REASONS, type ChatOutcome } from '../types';

/** Remembers labels seen per role so changed rows can be highlighted after logging a chat. */
const lastLabels = new Map<string, Map<string, HypothesisLabel>>();

export function LearningPage() {
  const { state, dispatch } = useAppState();
  const role = useSelectedRole();
  const analysis = useRoleAnalysis(role);
  const [params, setParams] = useSearchParams();
  const [formFor, setFormFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [changed, setChanged] = useState<{ ids: Set<string>; tick: number }>({ ids: new Set(), tick: 0 });
  const tickRef = useRef(0);
  const ranked = useRanked(role);

  // Baseline so accepting a suggestion highlights moved rows on the Candidates page.
  useEffect(() => {
    rememberIfUnseen(role.id, new Map(ranked.map((r) => [r.candidate.id, r.rank])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.id]);

  // Deep link from the Pipeline board: /learning?log=<candidateId>
  useEffect(() => {
    const id = params.get('log');
    if (!id) return;
    const cand = state.candidates.find((c) => c.id === id);
    if (cand) {
      if (cand.roleId !== state.selectedRoleId) dispatch({ type: 'SELECT_ROLE', roleId: cand.roleId });
      setFormFor(id);
    }
    params.delete('log');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const now = new Map(analysis.map((a) => [a.criterion.id, a.label]));
    const prev = lastLabels.get(role.id);
    lastLabels.set(role.id, now);
    if (!prev) return;
    const ids = new Set([...now].filter(([id, l]) => prev.has(id) && prev.get(id) !== l).map(([id]) => id));
    if (ids.size) setChanged({ ids, tick: ++tickRef.current });
  }, [analysis, role.id]);

  useEffect(() => {
    if (!changed.ids.size) return;
    const t = setTimeout(() => setChanged((c) => ({ ...c, ids: new Set() })), 2500);
    return () => clearTimeout(t);
  }, [changed]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const chatByCandidate = useMemo(() => new Map(state.chats.map((c) => [c.candidateId, c])), [state.chats]);
  const awaiting = state.candidates.filter((c) => c.status === 'done' && !chatByCandidate.has(c.id));
  const roleChats = state.chats
    .filter((c) => c.roleId === role.id)
    .sort((a, b) => b.at.localeCompare(a.at));
  const suggestion = suggestRubricChange(role, analysis);
  const dismissed = suggestion ? state.dismissedSuggestions.includes(suggestion.key) : false;
  const overstated = overstatedCriteria(analysis);
  const skips = skipReasonCounts(state.candidates, role.id);
  const skipTotal = Object.values(skips).reduce((a, b) => a + b, 0);
  const signal = skipSignal(skips);

  const formCandidate = formFor ? state.candidates.find((c) => c.id === formFor) : undefined;
  const formRole = formCandidate ? state.roles.find((r) => r.id === formCandidate.roleId) : undefined;

  return (
    <>
      <PageHeader
        title="Learning"
        subtitle="Every criterion is a hypothesis. Coffee-chat outcomes show which ones are holding up — and suggest how to re-weight the rubric."
        actions={<HowItWorksLink label="How labels work" hash="learning" />}
      />

      {/* Awaiting feedback */}
      <section className="card mb-6 p-5" aria-labelledby="awaiting-h">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="awaiting-h" className="font-semibold text-navy-900">
              {awaiting.length ? `${awaiting.length} ${awaiting.length === 1 ? 'chat' : 'chats'} awaiting feedback` : 'All chats have feedback'}
            </h2>
            <p className="text-sm text-slate-500">
              {awaiting.length ? 'About 30 seconds each. The analysis below updates as soon as you save.' : 'Nice. New chats appear here when they move to “Chat done” on the Pipeline.'}
            </p>
          </div>
        </div>
        {awaiting.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {awaiting.map((c) => (
              <button
                key={c.id}
                className="btn-secondary"
                onClick={() => setFormFor(c.id)}
                data-tour="log-feedback"
              >
                <MessageSquareText className="h-4 w-4" /> Log chat with {c.name}
                <span className="text-xs text-slate-400">· {state.roles.find((r) => r.id === c.roleId)?.title}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <RoleSelector />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong>Small samples — indicative only; a human decides.</strong> These are simple, transparent rules on fictional
          chats, not a statistical model or AI.
        </p>
      </div>

      {/* Suggested rubric change */}
      <section className="card mb-6 overflow-hidden" aria-labelledby="suggest-h">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Lightbulb className="h-4 w-4 text-teal-600" aria-hidden />
          <h2 id="suggest-h" className="font-semibold text-navy-900">Suggested rubric change · {role.title}</h2>
        </div>
        {suggestion && !dismissed ? (
          <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <WeightMove icon={TrendingDown} tone="rose" label={`Lower ${shortName(suggestion.lower.name)}`} from={suggestion.lower.from} to={suggestion.lower.to} />
              <WeightMove icon={TrendingUp} tone="teal" label={`Raise ${shortName(suggestion.raise.name)}`} from={suggestion.raise.from} to={suggestion.raise.to} />
            </div>
            <p className="mt-4 text-sm text-slate-600">{suggestion.reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="btn-teal"
                data-tour="accept-suggestion"
                onClick={() => {
                  dispatch({ type: 'ACCEPT_SUGGESTION', suggestion });
                  setToast('Weights updated and logged in Weight history. Candidates have re-ranked.');
                }}
              >
                <Check className="h-4 w-4" /> Accept change
              </button>
              <button className="btn-secondary" onClick={() => dispatch({ type: 'DISMISS_SUGGESTION', key: suggestion.key })}>
                <X className="h-4 w-4" /> Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-600">
            {dismissed
              ? 'Dismissed. A new suggestion appears if more chats change the picture.'
              : 'No change suggested right now — the chats don’t yet point clearly at a criterion to lower and one to raise for this role. Log more chats to sharpen the picture.'}
          </div>
        )}
      </section>

      {/* Hypothesis table */}
      <section className="card mb-6 overflow-hidden" aria-labelledby="hyp-h">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 id="hyp-h" className="font-semibold text-navy-900">Hypothesis check</h2>
          <p className="text-sm text-slate-500">
            Did candidates whose profiles rated high (≥ {HIGH_PREDICTED_THRESHOLD}) do better in chats than those rated lower?
          </p>
        </div>
        {analysis.every((a) => a.n === 0) ? (
          <div className="p-5">
            <EmptyState icon={Coffee} title="No chats to learn from yet">
              Log coffee-chat feedback and each criterion gets tested here.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Criterion</th>
                  <th className="px-3 py-2.5 text-right font-medium">Chats</th>
                  <th className="px-3 py-2.5 text-right font-medium" title="Average outcome: Progress = 100%, Maybe = 50%, Not a fit = 0%">
                    Rated high → did
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium" title="Average outcome: Progress = 100%, Maybe = 50%, Not a fit = 0%">
                    Rated low → did
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium" title="Profile rating minus observed chat rating, on average">
                    Profile vs chat
                  </th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.map((a) => (
                  <HypothesisRow key={`${a.criterion.id}-${changed.ids.has(a.criterion.id) ? changed.tick : 0}`} a={a} flash={changed.ids.has(a.criterion.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
          “Did” = average outcome (Progress 100%, Maybe 50%, Not a fit 0%). Profile vs chat: + means profiles rated higher than
          what showed up. Shared qualities and pedigree-style criteria are pooled across roles.
        </p>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card min-w-0 p-5" aria-labelledby="overstated-h">
          <div className="mb-3 flex items-center gap-2">
            <ScanEye className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 id="overstated-h" className="font-semibold text-navy-900">Profiles vs chats</h2>
          </div>
          {overstated.length === 0 ? (
            <p className="text-sm text-slate-500">
              No criterion is consistently overstated by profiles for this role yet.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-600">Profiles consistently rated these higher than what showed up in chats:</p>
              <ul className="space-y-2">
                {overstated.map((a) => (
                  <li key={a.criterion.id} className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm">
                    <span className="font-medium text-navy-900">{shortName(a.criterion.name)}</span>
                    <span className="shrink-0 tabular-nums text-rose-700">
                      +{a.gap!.toFixed(1)} pts · {a.gapN} chats
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Worth probing in screening rather than trusting the profile.</p>
            </>
          )}
        </section>

        <section className="card min-w-0 p-5" aria-labelledby="skips-h">
          <div className="mb-3 flex items-center gap-2">
            <SkipForward className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 id="skips-h" className="font-semibold text-navy-900">Why candidates were skipped</h2>
          </div>
          {skipTotal === 0 ? (
            <p className="text-sm text-slate-500">
              No skips for this role yet. Reasons you pick in Quick review show up here as a rubric signal.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {SKIP_REASONS.map((r) => {
                  const n = skips[r.id];
                  return (
                    <li key={r.id} className="text-sm">
                      <div className="mb-1 flex justify-between">
                        <span className="text-navy-900">{r.label}</span>
                        <span className="tabular-nums text-slate-500">{n}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-navy-600" style={{ width: `${(n / skipTotal) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {signal && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{signal}</p>}
            </>
          )}
        </section>
      </div>

      {/* Chat log */}
      <section className="card p-5" aria-labelledby="log-h">
        <h2 id="log-h" className="mb-3 font-semibold text-navy-900">Chat log · {role.title}</h2>
        {roleChats.length === 0 ? (
          <EmptyState
            icon={Coffee}
            title="No chats logged for this role yet"
            action={<Link to="/pipeline" className="btn-secondary">Go to Pipeline <ArrowRight className="h-4 w-4" /></Link>}
          >
            Book coffee chats from the Pipeline, then log feedback here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100">
            {roleChats.map((chat) => {
              const cand = state.candidates.find((c) => c.id === chat.candidateId);
              if (!cand) return null;
              return (
                <li key={chat.id} className="flex items-start gap-3 py-3">
                  <OutcomeDot outcome={chat.outcome} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium text-navy-900">{cand.name}</span>
                      <span className="text-sm text-slate-500">{OUTCOME_LABEL[chat.outcome]}</span>
                      <span className="text-xs text-slate-400">· {formatTime(chat.at)}</span>
                    </div>
                    {chat.note && <p className="text-sm text-slate-600">{chat.note}</p>}
                  </div>
                  <button className="btn-ghost shrink-0 px-2 py-1 text-xs" onClick={() => setFormFor(cand.id)} aria-label={`Edit feedback for ${cand.name}`}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {formCandidate && formRole && (
        <FeedbackForm
          candidate={formCandidate}
          role={formRole}
          existing={chatByCandidate.get(formCandidate.id)}
          onClose={() => setFormFor(null)}
          onSaved={(name) => {
            if (formCandidate.roleId !== state.selectedRoleId) dispatch({ type: 'SELECT_ROLE', roleId: formCandidate.roleId });
            setToast(`Feedback for ${name} saved — hypotheses updated.`);
          }}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl bg-navy-900 px-4 py-3 text-sm text-white shadow-2xl">
            <Check className="h-4 w-4 text-teal-300" />
            {toast}
            <Link to="/candidates" className="font-medium text-teal-300 hover:text-teal-200">View ranking</Link>
          </div>
        </div>
      )}
    </>
  );
}

function HypothesisRow({ a, flash }: { a: CriterionAnalysis; flash: boolean }) {
  const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);
  return (
    <tr className={flash ? 'animate-moved' : ''}>
      <td className="px-5 py-3">
        <div className="font-medium text-navy-900">{a.criterion.name}</div>
        {a.pooled && <div className="text-xs text-slate-400">pooled across roles</div>}
      </td>
      <td className="px-3 py-3 text-right tabular-nums">{a.n}</td>
      <td className="px-3 py-3 text-right">
        <div className="tabular-nums font-medium text-navy-900">{pct(a.highAvg)}</div>
        <div className="text-xs text-slate-400">{a.highN} {a.highN === 1 ? 'chat' : 'chats'}</div>
      </td>
      <td className="px-3 py-3 text-right">
        <div className="tabular-nums font-medium text-navy-900">{pct(a.lowAvg)}</div>
        <div className="text-xs text-slate-400">{a.lowN} {a.lowN === 1 ? 'chat' : 'chats'}</div>
      </td>
      <td className="px-3 py-3 text-right">
        {a.gap === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <>
            <div className={`tabular-nums font-medium ${a.gap >= 0.75 ? 'text-rose-700' : 'text-navy-900'}`}>
              {a.gap > 0 ? '+' : ''}
              {a.gap.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400">{a.gapN} rated</div>
          </>
        )}
      </td>
      <td className="px-5 py-3"><HypothesisChip label={a.label} /></td>
    </tr>
  );
}

function WeightMove({
  icon: Icon,
  tone,
  label,
  from,
  to,
}: {
  icon: typeof TrendingUp;
  tone: 'rose' | 'teal';
  label: string;
  from: number;
  to: number;
}) {
  const c = tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700';
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div>
        <div className="text-sm font-medium text-navy-900">{label}</div>
        <div className="text-lg font-semibold tabular-nums text-navy-900">
          {from} <span className="text-slate-400">→</span> {to}
        </div>
      </div>
    </div>
  );
}

function OutcomeDot({ outcome }: { outcome: ChatOutcome }) {
  const c = outcome === 'progress' ? 'bg-emerald-500' : outcome === 'maybe' ? 'bg-amber-400' : 'bg-rose-500';
  return <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${c}`} aria-hidden />;
}
