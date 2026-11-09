import { Handshake, Inbox, Layers, MessageSquare, Share2, Star, Undo2, Wand2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { HowItWorksLink } from '../components/HowItWorksLink';
import { InfoTip } from '../components/InfoTip';
import { OutreachModal } from '../components/OutreachModal';
import { PageHeader } from '../components/PageHeader';
import { ProfileLink } from '../components/ProfileActions';
import { QuickReview } from '../components/QuickReview';
import { RoleSelector } from '../components/RoleSelector';
import { ShareDialog } from '../components/ShareDialog';
import {
  computeKpis,
  hasReplied,
  pickShortlist,
  PIPELINE_COLUMNS,
  resultsBySource,
  reviewDeck,
  STATUS_LABEL,
} from '../lib/pipeline';
import { rankCandidates, type RankedCandidate } from '../lib/scoring';
import { useAppState, useSelectedRole } from '../state/AppState';
import { SKIP_REASONS, type Candidate, type PipelineStatus, type SkipReason } from '../types';
import { Segmented } from './CandidatesPage';

type Scope = 'role' | 'all';

export function PipelinePage() {
  const { state, dispatch } = useAppState();
  const role = useSelectedRole();
  const [scope, setScope] = useState<Scope>('role');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [generated, setGenerated] = useState<number | undefined>(undefined);
  const [outreachFor, setOutreachFor] = useState<Candidate | null>(null);
  const [match, setMatch] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scopeRoleId = scope === 'role' ? role.id : null;

  const ranked = useMemo(
    () =>
      state.roles
        .filter((r) => scope === 'all' || r.id === role.id)
        .flatMap((r) => rankCandidates(state.candidates, r)),
    [state.roles, state.candidates, scope, role.id],
  );
  const kpis = useMemo(() => computeKpis(state.candidates), [state.candidates]);
  const sources = useMemo(() => resultsBySource(state.candidates, state.chats), [state.candidates, state.chats]);
  const deck = reviewDeck(state.candidates, state.roles, scopeRoleId, state.reviewLog);

  useEffect(() => {
    if (!match) return;
    const t = setTimeout(() => setMatch(null), 2400);
    return () => clearTimeout(t);
  }, [match]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const moveTo = useCallback(
    (c: Candidate, status: PipelineStatus, skipReason?: SkipReason) => {
      if (status === c.status) return;
      if (status === 'booked' && !hasReplied(c)) setMatch(c.name);
      dispatch({ type: 'SET_STATUS', candidateIds: [c.id], status, skipReason });
    },
    [dispatch],
  );
  const markReplied = (c: Candidate) => {
    dispatch({ type: 'SET_REPLIED', candidateId: c.id, replied: true });
    setMatch(c.name);
  };

  const generate = () => {
    const ids = pickShortlist(state.candidates, state.roles, scopeRoleId);
    if (ids.length === 0) {
      setNotice('No new candidates left to suggest.');
      return;
    }
    dispatch({ type: 'GENERATE_SHORTLIST', roleId: scopeRoleId });
    setGenerated(ids.length);
    setShareOpen(true);
  };

  return (
    <>
      <PageHeader title="Pipeline" subtitle="This week's shortlist, outreach and chats." actions={<HowItWorksLink />} />
      <RoleSelector />

      <div className="mb-10 flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => setReviewOpen(true)} data-tour="quick-review">
          <Layers className="h-4 w-4" /> Review shortlist
          {deck.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs tabular-nums">{deck.length}</span>}
        </button>
        <button className="btn-secondary" onClick={generate} data-tour="generate">
          <Wand2 className="h-4 w-4" /> Generate shortlist
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            setGenerated(undefined);
            setShareOpen(true);
          }}
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
        <div className="sm:ml-auto">
          <Segmented
            label="Scope"
            value={scope}
            onChange={(v) => setScope(v as Scope)}
            options={[
              { value: 'role', label: role.title },
              { value: 'all', label: 'All roles' },
            ]}
          />
        </div>
        {notice && <p className="w-full text-sm text-ink-500" role="status">{notice}</p>}
      </div>

      <Kpis kpis={kpis} />

      <Board
        ranked={ranked}
        showRole={scope === 'all'}
        onMove={moveTo}
        onReplied={markReplied}
        onDraft={setOutreachFor}
        hasFeedback={(id) => state.chats.some((c) => c.candidateId === id)}
      />

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-5">
        <SourceTable rows={sources} />
        <WeeklyRhythm />
      </div>

      {reviewOpen && <QuickReview roleId={scopeRoleId} onClose={() => setReviewOpen(false)} />}
      {shareOpen && <ShareDialog roleId={scopeRoleId} generated={generated} onClose={() => setShareOpen(false)} />}
      {outreachFor && (
        <OutreachModal
          candidate={outreachFor}
          role={state.roles.find((r) => r.id === outreachFor.roleId)!}
          onClose={() => setOutreachFor(null)}
          onMarkContacted={outreachFor.status === 'approved' ? () => moveTo(outreachFor, 'contacted') : undefined}
        />
      )}
      {match && <MatchMoment name={match} />}
    </>
  );
}

function Kpis({ kpis }: { kpis: ReturnType<typeof computeKpis> }) {
  const tiles = [
    { label: 'Shortlisted this week', value: kpis.shortlistedThisWeek },
    { label: 'Contacted', value: kpis.contacted },
    {
      label: 'Reply rate',
      value: kpis.replyRate === null ? '—' : `${Math.round(kpis.replyRate * 100)}%`,
      sub: `(${kpis.replied} of ${kpis.contacted})`,
    },
    { label: 'Chats booked', value: kpis.chatsBooked },
    { label: 'Chats done', value: kpis.chatsDone },
  ];
  return (
    <dl className="mb-12 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label}>
          <dt className="text-xs text-ink-400">{t.label}</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums text-ink-900">
            {t.value}
            {t.sub && <span className="ml-1.5 text-xs font-normal text-ink-400">{t.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Board({
  ranked,
  showRole,
  onMove,
  onReplied,
  onDraft,
  hasFeedback,
}: {
  ranked: RankedCandidate[];
  showRole: boolean;
  onMove: (c: Candidate, s: PipelineStatus, reason?: SkipReason) => void;
  onReplied: (c: Candidate) => void;
  onDraft: (c: Candidate) => void;
  hasFeedback: (id: string) => boolean;
}) {
  const { state } = useAppState();
  const [dragOver, setDragOver] = useState<PipelineStatus | null>(null);
  const roleTitle = (id: string) => state.roles.find((r) => r.id === id)?.title ?? '';
  const inPipeline = ranked.filter((r) => r.candidate.status !== 'new');

  if (inPipeline.length === 0) {
    return <EmptyState icon={Inbox} title="Nobody in the pipeline yet." />;
  }

  const onDrop = (e: DragEvent, status: PipelineStatus) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const r = ranked.find((x) => x.candidate.id === id);
    if (r) onMove(r.candidate, status);
  };

  return (
    <section aria-label="Pipeline board">
      <div className="relative pb-2 md:overflow-x-auto">
        <div className="flex flex-col gap-3 md:min-w-max md:flex-row md:items-start md:gap-4">
          {PIPELINE_COLUMNS.map((col) => {
            const items = ranked
              .filter((r) => r.candidate.status === col.status)
              .sort(
                (a, b) =>
                  Number(Boolean(b.candidate.priority)) - Number(Boolean(a.candidate.priority)) ||
                  b.cautiousFit - a.cautiousFit,
              );
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.status);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, col.status)}
                className={`flex w-full flex-col rounded-2xl p-2 transition-colors md:w-64 ${dragOver === col.status ? 'bg-ink-100' : 'bg-ink-50'}`}
                data-tour={`col-${col.status}`}
              >
                <div className={`flex items-center justify-between px-2 pt-1 ${items.length ? 'mb-2' : 'pb-1 md:mb-2 md:pb-0'}`}>
                  <h3 className="text-sm font-medium text-ink-700">{col.label}</h3>
                  <span className="text-xs tabular-nums text-ink-400">{items.length}</span>
                </div>
                <div className="flex max-h-[34rem] flex-col gap-2 overflow-y-auto">
                  {items.length === 0 && <p className="hidden px-2 py-3 text-xs text-ink-400 md:block">Empty</p>}
                  {items.map((r) => (
                    <BoardCard
                      key={r.candidate.id}
                      item={r}
                      roleTitle={showRole ? roleTitle(r.candidate.roleId) : undefined}
                      onMove={onMove}
                      onReplied={onReplied}
                      onDraft={onDraft}
                      feedbackLogged={hasFeedback(r.candidate.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BoardCard({
  item,
  roleTitle,
  onMove,
  onReplied,
  onDraft,
  feedbackLogged,
}: {
  item: RankedCandidate;
  roleTitle?: string;
  onMove: (c: Candidate, s: PipelineStatus, reason?: SkipReason) => void;
  onReplied: (c: Candidate) => void;
  onDraft: (c: Candidate) => void;
  feedbackLogged: boolean;
}) {
  const c = item.candidate;
  const [skipping, setSkipping] = useState(false);
  const fit = item.score.fit === null ? '—' : `${Math.round(item.cautiousFit)}%`;

  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
      className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-ink-100"
      data-testid={`card-${c.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {roleTitle && <div className="truncate text-[11px] text-ink-500">{roleTitle}</div>}
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-ink-900">{c.name}</span>
            {c.priority && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 text-[11px] font-medium text-amber-700" title="CEO wants to meet personally">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                <span className="sr-only">Priority</span>
              </span>
            )}
          </div>
          <div className="truncate text-xs text-ink-400">{c.headline}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-semibold tabular-nums text-ink-900">{fit}</span>
          <div className="flex items-center gap-0.5">
            <ProfileLink candidate={c} iconOnly className="rounded-full p-1 text-ink-400 hover:text-ink-900" />
            <button
              className="rounded-full p-1 text-ink-400 hover:text-ink-900"
              onClick={() => onDraft(c)}
              aria-label={`Contact ${c.name}`}
              title="Contact"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1 empty:hidden">
        {c.status === 'contacted' && c.replied && <span className="chip bg-teal-50 text-teal-800">Replied</span>}
        {c.status === 'skipped' && c.skipReason && (
          <span className="chip bg-ink-100 text-ink-500">{SKIP_REASONS.find((r) => r.id === c.skipReason)?.label}</span>
        )}
        {item.needsMoreEvidence && ['suggested', 'approved'].includes(c.status) && (
          <span className="chip bg-amber-50 text-amber-700">Needs evidence</span>
        )}
      </div>

      {c.status === 'done' && (
        <p className="mt-2 text-xs text-ink-500">Next step: hand to your applicant tracking system (ATS) — not connected in demo</p>
      )}

      {skipping ? (
        <div className="mt-2">
          <p className="mb-1 text-xs text-ink-500">Why skip?</p>
          <div className="flex flex-wrap gap-1">
            {SKIP_REASONS.map((r) => (
              <button
                key={r.id}
                className="chip bg-ink-100 text-ink-700 hover:bg-ink-200"
                onClick={() => {
                  onMove(c, 'skipped', r.id);
                  setSkipping(false);
                }}
              >
                {r.label}
              </button>
            ))}
            <button className="chip text-ink-400 hover:text-ink-700" onClick={() => setSkipping(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {c.status === 'suggested' && (
            <>
              <CardBtn primary onClick={() => onMove(c, 'approved')}>Approve</CardBtn>
              <CardBtn onClick={() => setSkipping(true)}>Skip</CardBtn>
            </>
          )}
          {c.status === 'approved' && (
            <>
              <CardBtn primary onClick={() => onDraft(c)}>Draft outreach</CardBtn>
              <CardBtn onClick={() => onMove(c, 'contacted')}>Contacted</CardBtn>
            </>
          )}
          {c.status === 'contacted' && (
            <>
              {!c.replied && <CardBtn onClick={() => onReplied(c)}>Replied</CardBtn>}
              <CardBtn primary onClick={() => onMove(c, 'booked')}>Chat booked</CardBtn>
            </>
          )}
          {c.status === 'booked' && <CardBtn primary onClick={() => onMove(c, 'done')}>Chat done</CardBtn>}
          {c.status === 'done' &&
            (feedbackLogged ? (
              <span className="text-xs text-ink-500">Feedback logged</span>
            ) : (
              <Link to={`/learning?log=${c.id}`} className="rounded-full bg-ink-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-ink-700" data-tour="log-feedback">
                Log feedback
              </Link>
            ))}
          {c.status === 'skipped' && (
            <CardBtn onClick={() => onMove(c, 'suggested')}>
              <Undo2 className="h-3 w-3" /> Restore
            </CardBtn>
          )}
          <label className="ml-auto">
            <span className="sr-only">Move {c.name} to</span>
            <select
              className="rounded-full border-0 bg-transparent py-0.5 pl-1.5 pr-6 text-xs text-ink-400 hover:text-ink-700 focus:ring-1 focus:ring-ink-200"
              value=""
              onChange={(e) => {
                const s = e.target.value as PipelineStatus;
                if (s === 'skipped') setSkipping(true);
                else if (s) onMove(c, s);
              }}
            >
              <option value="">Move</option>
              {PIPELINE_COLUMNS.filter((col) => col.status !== c.status).map((col) => (
                <option key={col.status} value={col.status}>{col.label}</option>
              ))}
              <option value="new">{STATUS_LABEL.new}</option>
            </select>
          </label>
        </div>
      )}
    </article>
  );
}

function CardBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        primary ? 'bg-ink-900 text-white hover:bg-ink-700' : 'text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50'
      }`}
    >
      {children}
    </button>
  );
}

function SourceTable({ rows }: { rows: ReturnType<typeof resultsBySource> }) {
  const withN = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}% (${a} of ${b})` : '—');
  return (
    <section className="min-w-0 lg:col-span-3" aria-labelledby="sources-h">
      <h2 id="sources-h" className="flex items-center gap-1.5 text-lg font-semibold text-ink-900">
        Results by source
        <InfoTip label="About results by source">
          Percentages are of people contacted. “Progressed” means the chat was marked Progress. Direct = LinkedIn
          outreach or referrals.
        </InfoTip>
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs text-ink-400">
            <tr className="border-b border-ink-100">
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="py-2 pr-3 text-right font-medium">Contacted</th>
              <th className="py-2 pr-3 text-right font-medium">Replied</th>
              <th className="py-2 pr-3 text-right font-medium">Chats</th>
              <th className="py-2 text-right font-medium">Progressed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.source}>
                <td className="py-3 pr-3 text-ink-900">
                  {r.source}
                  {(r.source === 'LinkedIn direct' || r.source === 'Network referral') && (
                    <span className="ml-2 text-xs font-medium text-ink-900">Direct</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums text-ink-600">{r.contacted}</td>
                <td className="whitespace-nowrap py-3 pr-3 text-right tabular-nums text-ink-600">{withN(r.replied, r.contacted)}</td>
                <td className="py-3 pr-3 text-right tabular-nums text-ink-600">{r.chats}</td>
                <td className="whitespace-nowrap py-3 text-right font-medium tabular-nums text-ink-900">{withN(r.progressed, r.contacted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-400">Demo data. Small samples — indicative only.</p>
    </section>
  );
}

function WeeklyRhythm() {
  const steps = [
    { day: 'Mon', who: 'Team', text: 'Sources & scores' },
    { day: 'Tue', who: 'CEO', text: 'Approves shortlist (~10 min)' },
    { day: 'Wed–Thu', who: 'Team', text: 'Outreach & booking' },
    { day: 'Fri', who: 'CEO', text: 'Logs chat feedback (~30 sec each) — rubric updates' },
  ];
  return (
    <section className="min-w-0 lg:col-span-2" aria-labelledby="rhythm-h">
      <h2 id="rhythm-h" className="text-lg font-semibold text-ink-900">Weekly rhythm</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.day} className="flex gap-3 text-sm">
            <span className="w-16 shrink-0 font-medium text-ink-900">{s.day}</span>
            <span className="text-ink-500">
              <span className={`mr-1.5 text-xs font-medium ${s.who === 'CEO' ? 'text-ink-900' : 'text-ink-400'}`}>{s.who}</span>
              {s.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MatchMoment({ name }: { name: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div className="animate-match flex items-center gap-3 rounded-full bg-ink-900 py-2.5 pl-2.5 pr-5 text-white shadow-2xl">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-900">
          <Handshake className="h-4 w-4" />
        </div>
        <div className="text-sm">
          <span className="font-semibold">It's a match</span>
          <span className="text-ink-300"> · {name} is up for a chat</span>
        </div>
      </div>
    </div>
  );
}
