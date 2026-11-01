import { describe, expect, it } from 'vitest';
import { SEED_CANDIDATES } from '../data/candidates';
import { isValidLinkedInProfileUrl, normaliseLinkedInProfileUrl } from './profile';

describe('LinkedIn profile URLs', () => {
  it('accepts only https://www.linkedin.com/in/... URLs', () => {
    expect(isValidLinkedInProfileUrl('https://www.linkedin.com/in/some-handle')).toBe(true);
    expect(isValidLinkedInProfileUrl('https://www.linkedin.com/in/some-handle/')).toBe(true);
    expect(isValidLinkedInProfileUrl('http://www.linkedin.com/in/some-handle')).toBe(false);
    expect(isValidLinkedInProfileUrl('https://linkedin.com/in/some-handle')).toBe(false);
    expect(isValidLinkedInProfileUrl('https://www.linkedin.com/company/acme')).toBe(false);
    expect(isValidLinkedInProfileUrl('https://www.linkedin.com.evil.io/in/x-y-z')).toBe(false);
    expect(isValidLinkedInProfileUrl('javascript:alert(1)')).toBe(false);
  });

  it('strips tracking params', () => {
    expect(normaliseLinkedInProfileUrl(' https://www.linkedin.com/in/abc-def?utm=x ')).toBe('https://www.linkedin.com/in/abc-def');
    expect(normaliseLinkedInProfileUrl('https://example.com')).toBeNull();
  });

  it('seeded fictional candidates never have profile URLs', () => {
    for (const c of SEED_CANDIDATES) expect(c.profileUrl).toBeUndefined();
  });
});
