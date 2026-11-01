import { ArrowRight, Check, Coffee, MessageSquareText, Pencil, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HypothesisChip } from '../components/Chips';
import { EmptyState } from '../components/EmptyState';
import { FeedbackForm } from '../components/FeedbackForm';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { InfoTip } from '../components/InfoTip';
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

const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);

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
  const roleChats = state.chats.filter((c) => c.roleId === role.id).sort((a, b) => b.at.localeCompare(a.at));
  const suggestion = suggestRubricChange(role, analysis);
  const dismissed = suggestion ? state.dismissedSuggestions.includes(suggestion.key) : false;
  const overstated = overstatedCriteria(analysis);
  const skips = skipReasonCounts(state.candidates, role.id);
  const skipTotal = Object.values(skips).reduce((a, b) => a + b, 0);
  const signal = skipSignal(skips);

  const formCandidate = formFor ? state.candidates.find((c) => c.id === formFor) : undefined;
  const formRole = formCandidate ? state.roles.find((r) => r.id === formCandidate.roleId) : undefined;
  const rowKey = (a: CriterionAnalysis) => `${a.criterion.id}-${changed.ids.has(a.criterion.id) ? changed.tick : 0}`;

  return (
    <>
      <PageHeader
        title="Learning"
        subtitle="Which criteria hold up in coffee chats."
        actions={<HowItWorksLink label="How labels work" hash="learning" />}
      />

      {awaiting.length > 0 && (
        <section className="mb-10 flex flex-col gap-3 rounded-2xl bg-ink-100 p-5 sm:flex-row sm:items-center" aria-label="Chats awaiting feedback">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
            <Coffee className="h-4 w-4" /> {awaiting.length} {awaiting.length === 1 ? 'chat needs' : 'chats need'} feedback
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {awaiting.map((c) => (
              <button key={c.id} className="btn-primary" onClick={() => setFormFor(c.id)} data-tour="log-feedback">
                <MessageSquareText className="h-4 w-4" /> Log {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </section>
      )}

      <RoleSelector />

      {/* Suggested rubric change */}
      <section className="mb-14" aria-labelledby="suggest-h">
        <h2 id="suggest-h" className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-ink-900">
          Suggested change
          <InfoTip label="About suggestions">
            Takes weight from the least-supported criterion and gives it to the best-supported one. You decide.
          </InfoTip>
        </h2>
        {suggestion && !dismissed ? (
          <div className="rounded-2xl bg-ink-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
              <WeightMove icon={TrendingDown} tone="rose" label={shortName(suggestion.lower.name)} from={suggestion.lower.from} to={suggestion.lower.to} />
              <WeightMove icon={TrendingUp} tone="teal" label={shortName(suggestion.raise.name)} from={suggestion.raise.from} to={suggestion.raise.to} />
            </div>
            <p className="mt-4 text-sm text-ink-500">{suggestion.reason}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="btn-teal"
                data-tour="accept-suggestion"
                onClick={() => {
                  dispatch({ type: 'ACCEPT_SUGGESTION', suggestion });
                  setToast('Weights updated. Candidates re-ranked.');
                }}
              >
                <Check className="h-4 w-4" /> Accept
              </button>
              <button className="btn-ghost" onClick={() => dispatch({ type: 'DISMISS_SUGGESTION', key: suggestion.key })}>
                <X className="h-4 w-4" /> Dismiss
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-400">{dismissed ? 'Dismissed.' : 'Nothing clear yet. Log more chats.'}</p>
        )}
      </section>

      {/* Hypothesis check */}
      <section className="mb-14" aria-labelledby="hyp-h">
        <h2 id="hyp-h" className="flex items-center gap-1.5 text-lg font-semibold text-ink-900">
          Hypothesis check
          <InfoTip label="How to read this">
            For each criterion: did people whose profiles rated it high (≥ {HIGH_PREDICTED_THRESHOLD}) do better in chats
            than people rated lower? Progress = 100%, Maybe = 50%, Not a fit = 0%. “Profile vs chat”: + means profiles
            rated higher than the chat showed. Shared qualities are pooled across roles.
          </InfoTip>
        </h2>
        <p className="mb-5 mt-1 text-sm text-ink-400">Small samples — a guide, not proof.</p>

        {analysis.every((a) => a.n === 0) ? (
          <EmptyState icon={Coffee} title="No chats to learn from yet." />
        ) : (
          <>
            <ul className="space-y-2 md:hidden">
              {analysis.map((a) => (
                <li key={rowKey(a)} className={`rounded-2xl bg-ink-50 p-4 ${changed.ids.has(a.criterion.id) ? 'animate-moved' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-ink-900">{shortName(a.criterion.name)}</span>
                    <HypothesisChip label={a.label} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-ink-500">
                    <span>High <b className="font-semibold text-ink-900">{pct(a.highAvg)}</b> ({a.highN})</span>
                    <span>Low <b className="font-semibold text-ink-900">{pct(a.lowAvg)}</b> ({a.lowN})</span>
                    <span>Gap <b className="font-semibold text-ink-900">{gapText(a)}</b></span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-ink-400">
                  <tr className="border-b border-ink-100">
                    <th className="py-3 pr-3 font-medium">Criterion</th>
                    <th className="py-3 pr-3 text-right font-medium">Chats</th>
                    <th className="py-3 pr-3 text-right font-medium">Rated high</th>
                    <th className="py-3 pr-3 text-right font-medium">Rated low</th>
                    <th className="py-3 pr-3 text-right font-medium">Profile vs chat</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {analysis.map((a) => (
                    <tr key={rowKey(a)} className={changed.ids.has(a.criterion.id) ? 'animate-moved' : ''}>
                      <td className="py-3.5 pr-3">
                        <div className="text-ink-900">{shortName(a.criterion.name)}</div>
                        {a.pooled && <div className="text-xs text-ink-400">all roles</div>}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums text-ink-500">{a.n}</td>
                      <td className="py-3.5 pr-3 text-right tabular-nums">
                        <span className="font-medium text-ink-900">{pct(a.highAvg)}</span>
                        <span className="ml-1 text-xs text-ink-400">({a.highN})</span>
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums">
                        <span className="font-medium text-ink-900">{pct(a.lowAvg)}</span>
                        <span className="ml-1 text-xs text-ink-400">({a.lowN})</span>
                      </td>
                      <td className={`py-3.5 pr-3 text-right tabular-nums ${a.gap !== null && a.gap >= 0.75 ? 'text-rose-600' : 'text-ink-500'}`}>
                        {gapText(a)}
                      </td>
                      <td className="py-3.5"><HypothesisChip label={a.label} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="mb-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <section className="min-w-0" aria-labelledby="overstated-h">
          <h2 id="overstated-h" className="mb-4 text-lg font-semibold text-ink-900">Profiles vs chats</h2>
          {overstated.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing consistently overstated.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-500">Profiles overstated:</p>
              <ul className="space-y-2">
                {overstated.map((a) => (
                  <li key={a.criterion.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-900">{shortName(a.criterion.name)}</span>
                    <span className="shrink-0 tabular-nums text-rose-600">+{a.gap!.toFixed(1)} ({a.gapN})</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="min-w-0" aria-labelledby="skips-h">
          <h2 id="skips-h" className="mb-4 text-lg font-semibold text-ink-900">Skip reasons</h2>
          {skipTotal === 0 ? (
            <p className="text-sm text-ink-400">No skips yet.</p>
          ) : (
            <>
              <ul className="space-y-2.5">
                {SKIP_REASONS.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="mb-1 flex justify-between">
                      <span className="text-ink-700">{r.label}</span>
                      <span className="tabular-nums text-ink-400">{skips[r.id]}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-ink-900" style={{ width: `${(skips[r.id] / skipTotal) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {signal && <p className="mt-3 text-sm text-ink-500">{signal}</p>}
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="log-h">
        <h2 id="log-h" className="mb-3 text-lg font-semibold text-ink-900">Chat log</h2>
        {roleChats.length === 0 ? (
          <EmptyState
            icon={Coffee}
            title="No chats for this role yet."
            action={<Link to="/pipeline" className="btn-secondary">Pipeline <ArrowRight className="h-4 w-4" /></Link>}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {roleChats.map((chat) => {
              const cand = state.candidates.find((c) => c.id === chat.candidateId);
              if (!cand) return null;
              return (
                <li key={chat.id} className="flex items-start gap-3 py-3.5">
                  <OutcomeDot outcome={chat.outcome} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium text-ink-900">{cand.name}</span>
                      <span className="text-sm text-ink-500">{OUTCOME_LABEL[chat.outcome]}</span>
                      <span className="text-xs text-ink-400">{formatTime(chat.at)}</span>
                    </div>
                    {chat.note && <p className="text-sm text-ink-500">{chat.note}</p>}
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
            setToast(`Saved ${name.split(' ')[0]}'s chat.`);
          }}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-full bg-ink-900 px-5 py-2.5 text-sm text-white shadow-2xl">
            <Check className="h-4 w-4 text-white" />
            {toast}
            <Link to="/candidates" className="font-medium text-white underline underline-offset-4">Ranking</Link>
          </div>
        </div>
      )}
    </>
  );
}

function gapText(a: CriterionAnalysis) {
  if (a.gap === null) return '—';
  return `${a.gap > 0 ? '+' : ''}${a.gap.toFixed(1)}`;
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
  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 shrink-0 ${tone === 'rose' ? 'text-rose-500' : 'text-teal-700'}`} aria-hidden />
      <div>
        <div className="text-sm text-ink-500">{label}</div>
        <div className="text-2xl font-semibold tabular-nums text-ink-900">
          {from} <span className="text-ink-400">→</span> {to}
        </div>
      </div>
    </div>
  );
}

function OutcomeDot({ outcome }: { outcome: ChatOutcome }) {
  const c = outcome === 'progress' ? 'bg-teal-600' : outcome === 'maybe' ? 'bg-amber-400' : 'bg-rose-500';
  return <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${c}`} aria-hidden />;
}
