import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Coffee,
  Handshake,
  Inbox,
  Layers,
  Mail,
  MessageSquareReply,
  Sparkles,
  Star,
  Undo2,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { OutreachModal } from '../components/OutreachModal';
import { PageHeader } from '../components/PageHeader';
import { QuickReview } from '../components/QuickReview';
import { RoleSelector } from '../components/RoleSelector';
import {
  computeKpis,
  hasReplied,
  pickShortlist,
  PIPELINE_COLUMNS,
  REVIEW_WEEKLY_CAP,
  reviewDeck,
  reviewsThisWeek,
  resultsBySource,
  STATUS_LABEL,
} from '../lib/pipeline';
import { rankCandidates, type RankedCandidate } from '../lib/scoring';
import { useAppState, useSelectedRole } from '../state/AppState';
import { SKIP_REASONS, type Candidate, type PipelineStatus, type SkipReason } from '../types';

type Scope = 'role' | 'all';

export function PipelinePage() {
  const { state, dispatch } = useAppState();
  const role = useSelectedRole();
  const [scope, setScope] = useState<Scope>('role');
  const [reviewOpen, setReviewOpen] = useState(false);
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
  const reviewedThisWeek = reviewsThisWeek(state.reviewLog).length;

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
      setNotice(
        scope === 'role'
          ? `No new candidates left to suggest for ${role.title}. Try “All roles”.`
          : 'No new candidates left to suggest. Everyone is already in the pipeline.',
      );
      return;
    }
    dispatch({ type: 'GENERATE_SHORTLIST', roleId: scopeRoleId });
    setNotice(`Added ${ids.length} ${ids.length === 1 ? 'candidate' : 'candidates'} to Suggested — review them below.`);
  };

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Generate this week's shortlist, review it in a couple of minutes, then track outreach and coffee chats."
        actions={
          <button className="btn-teal" onClick={generate} data-tour="generate">
            <Wand2 className="h-4 w-4" /> Generate this week's shortlist
          </button>
        }
      />
      <RoleSelector />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="radiogroup" aria-label="Scope">
          {(['role', 'all'] as Scope[]).map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={scope === s}
              onClick={() => setScope(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${scope === s ? 'bg-navy-800 text-white' : 'text-navy-700 hover:bg-slate-100'}`}
            >
              {s === 'role' ? role.title : 'All roles'}
            </button>
          ))}
        </div>
        {notice && (
          <span className="chip bg-teal-50 px-3 py-1 text-sm text-teal-800" role="status">
            {notice}
          </span>
        )}
      </div>

      <KpiStrip kpis={kpis} />

      <section className="card mb-6 flex flex-col gap-4 bg-gradient-to-r from-navy-900 to-navy-800 p-5 text-white sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
          <Layers className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Review this week's shortlist</h2>
          <p className="text-sm text-navy-200">
            {deck.length > 0
              ? `${deck.length} ${deck.length === 1 ? 'card' : 'cards'} waiting · swipe or tap to approve, skip or star · about 2 minutes`
              : reviewedThisWeek >= REVIEW_WEEKLY_CAP
                ? `Weekly cap of ${REVIEW_WEEKLY_CAP} reached — you're done for this week.`
                : 'Nothing waiting. Generate this week’s shortlist to fill the stack.'}
          </p>
        </div>
        <button
          className="btn bg-teal-400 text-navy-950 hover:bg-teal-300"
          onClick={() => setReviewOpen(true)}
          data-tour="quick-review"
        >
          {deck.length > 0 ? 'Start quick review' : 'Open summary'} <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <Board
        ranked={ranked}
        showRole={scope === 'all'}
        onMove={moveTo}
        onReplied={markReplied}
        onDraft={setOutreachFor}
        hasFeedback={(id) => state.chats.some((c) => c.candidateId === id)}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <SourceTable rows={sources} />
        <WeeklyRhythm />
      </div>

      {reviewOpen && <QuickReview roleId={scopeRoleId} onClose={() => setReviewOpen(false)} />}
      {outreachFor && (
        <OutreachModal
          candidate={outreachFor}
          role={state.roles.find((r) => r.id === outreachFor.roleId)!}
          onClose={() => setOutreachFor(null)}
          onMarkContacted={
            outreachFor.status === 'approved' ? () => moveTo(outreachFor, 'contacted') : undefined
          }
        />
      )}
      {match && <MatchMoment name={match} />}
    </>
  );
}

function KpiStrip({ kpis }: { kpis: ReturnType<typeof computeKpis> }) {
  const tiles = [
    { label: 'Shortlisted this week', value: kpis.shortlistedThisWeek, icon: ClipboardList },
    { label: 'Contacted', value: kpis.contacted, icon: Mail },
    {
      label: 'Reply rate',
      value: kpis.replyRate === null ? '—' : `${Math.round(kpis.replyRate * 100)}%`,
      sub: `${kpis.replied} of ${kpis.contacted}`,
      icon: MessageSquareReply,
    },
    { label: 'Chats booked', value: kpis.chatsBooked, icon: CalendarCheck },
    { label: 'Chats done', value: kpis.chatsDone, icon: Coffee },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <t.icon className="h-3.5 w-3.5" aria-hidden /> {t.label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-navy-900">{t.value}</div>
          {t.sub && <div className="text-xs text-slate-400">{t.sub}</div>}
        </div>
      ))}
    </div>
  );
}

const COLUMN_EMPTY: Record<PipelineStatus, string> = {
  new: '',
  suggested: 'Generate this week’s shortlist to fill this column.',
  approved: 'Approve candidates in Quick review.',
  contacted: 'Draft outreach for approved candidates.',
  booked: 'Mark replies, then book a chat.',
  done: 'Completed chats land here.',
  skipped: 'Nobody skipped. Nice.',
};

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
    return (
      <EmptyState icon={Inbox} title="Nobody in the pipeline yet">
        Click “Generate this week's shortlist” to suggest the top candidates, or add people from the Candidates page.
      </EmptyState>
    );
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
      <div className="relative -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-start gap-3">
          {PIPELINE_COLUMNS.map((col) => {
            const items = ranked
              .filter((r) => r.candidate.status === col.status)
              .sort((a, b) => Number(Boolean(b.candidate.priority)) - Number(Boolean(a.candidate.priority)) || (b.score.fit ?? 0) - (a.score.fit ?? 0));
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.status);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, col.status)}
                className={`flex w-64 flex-col rounded-xl border p-2.5 transition-colors ${
                  dragOver === col.status ? 'border-teal-400 bg-teal-50/60' : col.status === 'skipped' ? 'border-slate-200 bg-slate-100/60' : 'border-slate-200 bg-slate-100'
                }`}
                data-tour={`col-${col.status}`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{col.label}</h3>
                  <span className="chip bg-white tabular-nums text-slate-600">{items.length}</span>
                </div>
                <div className="flex max-h-[34rem] flex-col gap-2 overflow-y-auto">
                  {items.length === 0 && <p className="px-1 py-3 text-xs text-slate-400">{COLUMN_EMPTY[col.status]}</p>}
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
      <p className="mt-2 text-xs text-slate-500">
        Use the buttons on each card, the “Move to” menu, or drag cards between columns on desktop.
      </p>
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
  const fit = item.score.fit === null ? '—' : `${Math.round(item.score.fit)}%`;

  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      data-testid={`card-${c.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {roleTitle && <div className="truncate text-[10px] font-medium uppercase tracking-wider text-teal-700">{roleTitle}</div>}
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-navy-900">{c.name}</span>
            {c.priority && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Priority" />}
          </div>
          <div className="truncate text-xs text-slate-500">{c.headline}</div>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-navy-900">{fit}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {c.priority && <span className="chip bg-amber-50 text-amber-700">CEO wants to meet</span>}
        {c.status === 'contacted' && c.replied && <span className="chip bg-teal-50 text-teal-700">Replied</span>}
        {c.status === 'skipped' && c.skipReason && (
          <span className="chip bg-slate-200 text-slate-600">{SKIP_REASONS.find((r) => r.id === c.skipReason)?.label}</span>
        )}
      </div>

      {c.status === 'done' && (
        <div className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
          <span className="font-medium">Next step:</span> hand to formal pipeline (Ashby — not connected in demo)
        </div>
      )}

      {skipping ? (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-slate-600">Why skip?</p>
          <div className="flex flex-wrap gap-1">
            {SKIP_REASONS.map((r) => (
              <button
                key={r.id}
                className="chip border border-slate-300 bg-white text-slate-700 hover:border-navy-400"
                onClick={() => {
                  onMove(c, 'skipped', r.id);
                  setSkipping(false);
                }}
              >
                {r.label}
              </button>
            ))}
            <button className="chip text-slate-400 hover:text-slate-600" onClick={() => setSkipping(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {c.status === 'suggested' && (
            <>
              <CardBtn primary onClick={() => onMove(c, 'approved')}>Approve</CardBtn>
              <CardBtn onClick={() => setSkipping(true)}>Skip</CardBtn>
            </>
          )}
          {c.status === 'approved' && (
            <>
              <CardBtn primary onClick={() => onDraft(c)}>Draft outreach</CardBtn>
              <CardBtn onClick={() => onMove(c, 'contacted')}>Mark contacted</CardBtn>
            </>
          )}
          {c.status === 'contacted' && (
            <>
              {!c.replied && <CardBtn onClick={() => onReplied(c)}>Mark replied</CardBtn>}
              <CardBtn primary onClick={() => onMove(c, 'booked')}>Chat booked</CardBtn>
              <CardBtn onClick={() => onDraft(c)}>Draft</CardBtn>
            </>
          )}
          {c.status === 'booked' && <CardBtn primary onClick={() => onMove(c, 'done')}>Chat done</CardBtn>}
          {c.status === 'done' &&
            (feedbackLogged ? (
              <span className="chip bg-emerald-50 text-emerald-700">Feedback logged</span>
            ) : (
              <Link to={`/learning?log=${c.id}`} className="btn-teal px-2.5 py-1 text-xs" data-tour="log-feedback">
                Log chat feedback
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
              className="rounded-md border border-slate-200 bg-white py-1 pl-1.5 pr-6 text-xs text-slate-600"
              value=""
              onChange={(e) => {
                const s = e.target.value as PipelineStatus;
                if (s === 'skipped') setSkipping(true);
                else if (s) onMove(c, s);
              }}
            >
              <option value="">Move to…</option>
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
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
        primary ? 'bg-navy-800 text-white hover:bg-navy-700' : 'border border-slate-300 bg-white text-navy-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function SourceTable({ rows }: { rows: ReturnType<typeof resultsBySource> }) {
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  return (
    <section className="card min-w-0 p-5 lg:col-span-3" aria-labelledby="sources-h">
      <h2 id="sources-h" className="font-semibold text-navy-900">Results by source</h2>
      <p className="mt-0.5 text-sm text-slate-500">Is direct sourcing beating agencies? Counted across all roles.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="py-2 pr-3 text-right font-medium">Contacted</th>
              <th className="py-2 pr-3 text-right font-medium">Replied</th>
              <th className="py-2 pr-3 text-right font-medium">Chats</th>
              <th className="py-2 pr-3 text-right font-medium">Progressed</th>
              <th className="py-2 text-right font-medium">Progress rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.source}>
                <td className="py-2.5 pr-3 font-medium text-navy-900">
                  {r.source}
                  {(r.source === 'LinkedIn direct' || r.source === 'Network referral') && (
                    <span className="chip ml-2 bg-teal-50 text-teal-700">Direct</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{r.contacted}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{r.replied}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{r.chats}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{r.progressed}</td>
                <td className="py-2.5 text-right font-semibold tabular-nums text-navy-900">{pct(r.progressed, r.contacted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Progress rate = chats marked “Progress” ÷ people contacted. Fictional data; small numbers.</p>
    </section>
  );
}

function WeeklyRhythm() {
  const steps = [
    { day: 'Mon', who: 'EA', text: 'Sources & scores candidates', icon: Sparkles },
    { day: 'Tue', who: 'CEO', text: 'Approves the shortlist (~10 min)', icon: Layers },
    { day: 'Wed–Thu', who: 'EA', text: 'Handles outreach & booking', icon: Handshake },
    { day: 'Fri', who: 'CEO', text: 'Logs chat feedback (~30 sec each) — the rubric updates', icon: Coffee },
  ];
  return (
    <section className="card min-w-0 p-5 lg:col-span-2" aria-labelledby="rhythm-h">
      <h2 id="rhythm-h" className="font-semibold text-navy-900">Weekly rhythm</h2>
      <p className="mt-0.5 text-sm text-slate-500">About 20 minutes of CEO time a week.</p>
      <ol className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.day} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <s.icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="text-sm">
              <div className="font-medium text-navy-900">
                {s.day} <span className={`chip ml-1 ${s.who === 'CEO' ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{s.who}</span>
              </div>
              <div className="text-slate-600">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MatchMoment({ name }: { name: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div className="animate-match flex items-center gap-3 rounded-2xl bg-navy-900 px-5 py-3.5 text-white shadow-2xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-navy-950">
          <Handshake className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">It's a match</div>
          <div className="text-sm text-navy-200">{name} is up for a coffee chat.</div>
        </div>
      </div>
    </div>
  );
}
