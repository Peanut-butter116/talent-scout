/**
 * Profile links are only accepted for profiles a user adds themselves (Sourcing), and only
 * as https://www.linkedin.com/in/<handle> URLs. Seeded demo candidates never get one, so we
 * never point at a real person by accident.
 */
const LINKEDIN_PROFILE = /^https:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9\-_%]{3,100}\/?$/;

export function isValidLinkedInProfileUrl(url: string): boolean {
  return LINKEDIN_PROFILE.test(url.trim());
}

/** Normalises a valid URL (trims, strips query/hash); returns null if invalid. */
export function normaliseLinkedInProfileUrl(url: string): string | null {
  const trimmed = url.trim().replace(/[?#].*$/, '');
  return isValidLinkedInProfileUrl(trimmed) ? trimmed : null;
}

export const DEMO_PROFILE_TOOLTIP = 'Demo candidate — no real profile';
