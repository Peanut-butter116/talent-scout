import { Bookmark, Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildSearch, linkedInSearchUrl, SEARCH_VARIANTS } from '../lib/search';
import { useAppState } from '../state/AppState';
import type { Role, SearchVariant } from '../types';
import { InfoTip } from './InfoTip';

/** Editable LinkedIn Boolean searches for the role. The person runs the search themselves. */
export function SearchBuilder({ role }: { role: Role }) {
  const { dispatch } = useAppState();
  const [variant, setVariant] = useState<SearchVariant>('broad');
  const [query, setQuery] = useState(() => buildSearch(role, 'broad'));
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setQuery(buildSearch(role, variant));
    setSaved(false);
  }, [role, variant]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: text is still selectable.
    }
  };

  return (
    <section aria-labelledby="search-h">
      <h2 id="search-h" className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-ink-900">
        Search LinkedIn
        <InfoTip label="About search">
          Boolean searches built from the role's titles and keywords. Edit freely, then run them on LinkedIn yourself — the
          app never logs in or fetches profiles.
        </InfoTip>
      </h2>
      <div className="mb-3 inline-flex flex-wrap rounded-full bg-ink-100 p-0.5" role="radiogroup" aria-label="Search type">
        {SEARCH_VARIANTS.map((v) => (
          <button
            key={v.id}
            role="radio"
            aria-checked={variant === v.id}
            onClick={() => setVariant(v.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${variant === v.id ? 'bg-white font-medium text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <textarea
        className="input h-24 resize-y font-mono text-[13px] leading-relaxed"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSaved(false);
        }}
        aria-label="LinkedIn search"
        spellCheck={false}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={linkedInSearchUrl(query)} target="_blank" rel="noopener noreferrer" className="btn-primary">
          Open in LinkedIn <ExternalLink className="h-4 w-4" />
        </a>
        <button className="btn-secondary" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          className="btn-secondary"
          disabled={saved || !query.trim()}
          onClick={() => {
            dispatch({
              type: 'SAVE_SEARCH',
              search: { id: `s-${Date.now().toString(36)}`, roleId: role.id, variant, query: query.trim(), at: new Date().toISOString() },
            });
            setSaved(true);
          }}
        >
          {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />} {saved ? 'Saved' : 'Save'}
        </button>
        <button className="btn-ghost" onClick={() => setQuery(buildSearch(role, variant))} aria-label="Reset search text">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
