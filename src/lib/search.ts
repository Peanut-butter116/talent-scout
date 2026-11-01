import { BUILDER_SIGNALS, ROLE_SEARCH } from '../data/criteriaText';
import type { Role, SearchVariant } from '../types';

export const SEARCH_VARIANTS: { id: SearchVariant; label: string }[] = [
  { id: 'broad', label: 'Broad' },
  { id: 'precise', label: 'Precise' },
  { id: 'builders', label: 'Unconventional builders' },
];

const q = (s: string) => (s.includes(' ') && !s.startsWith('"') ? `"${s}"` : s);
const any = (xs: string[]) => (xs.length === 1 ? q(xs[0]) : `(${xs.map(q).join(' OR ')})`);

/** Editable LinkedIn Boolean search strings, built from the role's titles, keywords and synonyms. */
export function buildSearch(role: Role, variant: SearchVariant): string {
  const s = ROLE_SEARCH[role.id] ?? { titles: [role.title], keywords: [], synonyms: [] };
  const kw = [...s.keywords, ...s.synonyms];
  switch (variant) {
    case 'broad':
      return kw.length ? `${any(s.titles)} AND ${any(kw)}` : any(s.titles);
    case 'precise':
      return [any(s.titles.slice(0, 2)), s.keywords.length ? any(s.keywords.slice(0, 3)) : '', 'NOT (recruiter OR intern OR student)']
        .filter(Boolean)
        .join(' AND ')
        .replace(' AND NOT', ' NOT');
    case 'builders':
      return `${any(BUILDER_SIGNALS)} AND ${any(kw.length ? kw : s.titles)}`;
  }
}

export function linkedInSearchUrl(query: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query.trim())}`;
}
