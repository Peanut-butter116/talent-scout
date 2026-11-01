import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EXAMPLE_PROFILES } from '../data/examples';
import { loadEmbedder } from '../lib/embedder';
import {
  extractWithKeywords,
  extractWithModel,
  guessHeadline,
  guessName,
  toEvidence,
  type Method,
  type Suggestion,
} from '../lib/extract';
import { normaliseLinkedInProfileUrl } from '../lib/profile';
import { rankCandidates } from '../lib/scoring';
import { useAppState } from '../state/AppState';
import type { Candidate, EvidenceStrength, Role } from '../types';
import { InfoTip } from './InfoTip';

type Row = Suggestion & { choice: EvidenceStrength | 'none'; value: number; note: string };
type Phase = 'edit' | 'loading' | 'review';

const MATCH_LABEL = (s: number, m: Method) => `${Math.round(s * 100)}% ${m === 'model' ? 'match' : 'keyword match'}`;

/**
 * Paste a profile → on-device matching suggests evidence → the person confirms/edits → save.
 * Profile text is used in memory only; we store just the confirmed evidence lines.
 */
export function AddProfile({ role }: { role: Role }) {
  const { state, dispatch } = useAppState();
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [url, setUrl] = useState('');
  const [searchId, setSearchId] = useState('');
  const [phase, setPhase] = useState<Phase>('edit');
  const [rows, setRows] = useState<Row[]>([]);
  const [method, setMethod] = useState<Method>('model');
  const [savedMsg, setSavedMsg] = useState<{ id: string; text: string } | null>(null);

  const urlOk = !url.trim() || normaliseLinkedInProfileUrl(url) !== null;
  const searches = state.savedSearches.filter((s) => s.roleId === role.id);

  const match = async (raw: string, forRole: Role) => {
    setSavedMsg(null);
    setPhase('loading');
    let suggestions: Suggestion[];
    let used: Method = 'model';
    try {
      const embed = await loadEmbedder();
      suggestions = await extractWithModel(raw, forRole, embed);
    } catch {
      used = 'keywords';
      suggestions = extractWithKeywords(raw, forRole);
    }
    setMethod(used);
    setRows(
      suggestions.map((s) => ({
        ...s,
        choice: s.strength ?? 'none',
        value: s.rating ?? 3,
        note: s.sentence ?? '',
      })),
    );
    setPhase('review');
  };

  const tryExample = (id: string) => {
    const ex = EXAMPLE_PROFILES.find((e) => e.id === id)!;
    const exRole = state.roles.find((r) => r.id === ex.roleId)!;
    if (exRole.id !== state.selectedRoleId) dispatch({ type: 'SELECT_ROLE', roleId: exRole.id });
    setText(ex.text);
    setName(guessName(ex.text));
    setHeadline(guessHeadline(ex.text));
    setUrl('');
    void match(ex.text, exRole);
  };

  const reset = () => {
    setPhase('edit');
    setRows([]);
    setText('');
    setName('');
    setHeadline('');
    setUrl('');
  };

  const save = () => {
    const evidence: Candidate['evidence'] = {};
    for (const r of rows) {
      if (r.choice === 'none') continue;
      evidence[r.criterionId] = toEvidence({ ...r, strength: r.choice, rating: r.value }, r.note);
    }
    const head = headline.trim() || guessHeadline(text);
    const at = head.match(/\bat\s+(.+)$/i);
    const candidate: Candidate = {
      id: `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || guessName(text) || 'Unnamed profile',
      headline: head.replace(/\s+at\s+.+$/i, '') || 'Added profile',
      employer: at ? at[1] : '—',
      roleId: role.id,
      source: 'LinkedIn direct',
      status: 'new',
      evidence,
      mustHaves: {},
      addedBy: 'you',
      addedAt: new Date().toISOString(),
      profileUrl: normaliseLinkedInProfileUrl(url) ?? undefined,
      searchId: searchId || undefined,
    };
    dispatch({ type: 'ADD_CANDIDATE', candidate });
    const ranked = rankCandidates([...state.candidates, candidate], role);
    const r = ranked.find((x) => x.candidate.id === candidate.id)!;
    setSavedMsg({ id: candidate.id, text: `${candidate.name} saved — #${r.rank} of ${ranked.length} for ${role.title} (fit ${Math.round(r.cautiousFit)}%).` });
    reset();
  };

  return (
    <section aria-labelledby="add-h">
      <h2 id="add-h" className="mb-1 flex items-center gap-1.5 text-lg font-semibold text-ink-900">
        Add a profile
        <InfoTip label="About adding profiles">
          Paste a profile or CV you found yourself. A small matching model on your device suggests evidence for each
          criterion; you check it before saving. Only the confirmed lines are kept, in this browser.
        </InfoTip>
      </h2>
      <p className="mb-4 text-sm text-ink-400">Profiles you add stay in this browser. Nothing is uploaded.</p>

      {savedMsg && (
        <p className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-900" role="status">
          <Check className="h-4 w-4" /> {savedMsg.text}
          <Link to="/candidates" className="font-medium underline underline-offset-4">View ranking</Link>
        </p>
      )}

      {phase !== 'review' && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-400">Try an example:</span>
            {EXAMPLE_PROFILES.map((ex) => (
              <button
                key={ex.id}
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={phase === 'loading'}
                onClick={() => tryExample(ex.id)}
                data-tour={ex.id === EXAMPLE_PROFILES[0].id ? 'try-example' : undefined}
              >
                {ex.label} · {state.roles.find((r) => r.id === ex.roleId)?.title}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
            <input className="input" placeholder="Headline (optional)" value={headline} onChange={(e) => setHeadline(e.target.value)} aria-label="Headline" />
            <div>
              <input
                className={`input ${urlOk ? '' : 'border-rose-500'}`}
                placeholder="https://www.linkedin.com/in/… (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-label="Profile URL"
                aria-invalid={!urlOk}
              />
              {!urlOk && <p className="mt-1 text-xs text-rose-600">Use a https://www.linkedin.com/in/… link.</p>}
            </div>
            <select className="input" value={searchId} onChange={(e) => setSearchId(e.target.value)} aria-label="Found via saved search">
              <option value="">Found via… (optional)</option>
              {searches.map((s) => (
                <option key={s.id} value={s.id}>{s.variant === 'builders' ? 'Builders' : s.variant === 'precise' ? 'Precise' : 'Broad'} search · {new Date(s.at).toLocaleDateString()}</option>
              ))}
            </select>
          </div>
          <textarea
            className="input mt-2 h-40 resize-y"
            placeholder="Paste a LinkedIn profile or CV text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Profile text"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              className="btn-primary"
              disabled={!text.trim() || !urlOk || phase === 'loading'}
              onClick={() => {
                if (!name.trim()) setName(guessName(text));
                if (!headline.trim()) setHeadline(guessHeadline(text));
                void match(text, role);
              }}
            >
              {phase === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {phase === 'loading' ? 'Matching…' : 'Match evidence'}
            </button>
            {phase === 'loading' && <span className="text-xs text-ink-400">Loading the matching model — first time only.</span>}
          </div>
        </>
      )}

      {phase === 'review' && (
        <div className="rounded-2xl bg-ink-50 p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="font-semibold text-ink-900">{name || 'Unnamed profile'}</div>
              <div className="text-sm text-ink-500">{headline || role.title}</div>
            </div>
            <span className="text-xs text-ink-500">
              {method === 'model' ? 'Suggested by an on-device matching model — please check.' : 'Suggested by keyword matching (model unavailable) — please check.'}
            </span>
          </div>
          <ul className="divide-y divide-ink-200/60">
            {rows.map((r, i) => {
              const c = role.criteria.find((x) => x.id === r.criterionId);
              if (!c) return null;
              const set = (patch: Partial<Row>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <li key={r.criterionId} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink-900">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-full bg-white p-0.5 ring-1 ring-ink-200" role="radiogroup" aria-label={`Evidence for ${c.name}`}>
                        {(['strong', 'weak', 'none'] as const).map((opt) => (
                          <button
                            key={opt}
                            role="radio"
                            aria-checked={r.choice === opt}
                            onClick={() => set({ choice: opt })}
                            className={`rounded-full px-2.5 py-1 text-xs ${r.choice === opt ? 'bg-ink-900 font-medium text-white' : 'text-ink-500 hover:text-ink-900'}`}
                          >
                            {opt === 'none' ? 'Missing' : opt === 'strong' ? 'Strong' : 'Weak'}
                          </button>
                        ))}
                      </div>
                      <select
                        className="rounded-full border-0 bg-white py-1 pl-2.5 pr-7 text-xs ring-1 ring-ink-200 disabled:opacity-40"
                        value={r.value}
                        disabled={r.choice === 'none'}
                        onChange={(e) => set({ value: Number(e.target.value) })}
                        aria-label={`Rating for ${c.name}`}
                      >
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}/5</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {r.sentence ? (
                    <div className="mt-1.5">
                      <textarea
                        rows={Math.max(1, Math.min(4, Math.ceil(r.note.length / 42)))}
                        className="w-full resize-none border-0 bg-transparent p-0 text-sm leading-snug text-ink-600 focus:ring-0 disabled:text-ink-300 sm:[field-sizing:content]"
                        value={r.note}
                        disabled={r.choice === 'none'}
                        onChange={(e) => set({ note: e.target.value })}
                        aria-label={`Evidence note for ${c.name}`}
                      />
                      <div className="text-[11px] text-ink-400">{MATCH_LABEL(r.similarity, r.method)}</div>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-ink-400">Nothing matched.</div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={save} data-tour="save-profile">
              <Check className="h-4 w-4" /> Confirm & save
            </button>
            <button className="btn-ghost" onClick={() => setPhase('edit')}>
              <X className="h-4 w-4" /> Back
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
