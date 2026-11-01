import { describe, expect, it } from 'vitest';
import { SEED_ROLES } from '../data/roles';
import { buildSearch, linkedInSearchUrl, SEARCH_VARIANTS } from './search';

describe('LinkedIn search builder', () => {
  it('builds three variants for every role', () => {
    for (const r of SEED_ROLES) {
      const qs = SEARCH_VARIANTS.map((v) => buildSearch(r, v.id));
      expect(new Set(qs).size).toBe(3);
      for (const q of qs) expect(q.length).toBeGreaterThan(10);
    }
  });

  it('uses Boolean operators and quotes multi-word phrases', () => {
    const ai = SEED_ROLES[0];
    expect(buildSearch(ai, 'broad')).toMatch(/^\(.*"ML Engineer".* OR .*\) AND \(/);
    expect(buildSearch(ai, 'precise')).toMatch(/ NOT \(recruiter OR intern OR student\)$/);
    expect(buildSearch(ai, 'builders')).toMatch(/hackathon/);
  });

  it('opens a LinkedIn people search with the query encoded', () => {
    const url = linkedInSearchUrl(' ("ML Engineer" OR AI) AND speech ');
    expect(url.startsWith('https://www.linkedin.com/search/results/people/?keywords=')).toBe(true);
    expect(decodeURIComponent(url.split('keywords=')[1])).toBe('("ML Engineer" OR AI) AND speech');
  });
});
