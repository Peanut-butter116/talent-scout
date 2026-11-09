import type { Role } from '../types';
import { CRITERION_TEXT } from './criteriaText';

/** The fictional company the demo is set in. */
export const COMPANY = { name: 'Northwind Labs', blurb: 'a 10-person AI startup' };

/**
 * Five generic roles at Northwind Labs. Weights in each role sum to 100.
 * Criterion ids, weights and themes are stable: the seeded learning story depends on them.
 */
const ROLES: Role[] = [
  {
    id: 'ai-eng',
    title: 'Founding AI Engineer',
    summary: 'Sets the technical direction for AI and builds the first models end to end.',
    criteria: [
      { id: 'ai_model', name: 'Model building from scratch', weight: 25 },
      { id: 'ai_rt', name: 'Real-time / low-latency ML (speech, streaming)', weight: 25 },
      { id: 'ai_pedigree', name: 'Pedigree (top lab or early AI team)', weight: 10, theme: 'pedigree' },
      { id: 'ai_judgement', name: 'Judgement on hard-to-undo calls', weight: 10 },
      { id: 'ai_builder', name: 'Builder', weight: 10, theme: 'builder', companyWide: true },
      { id: 'ai_sharp', name: 'Curious problem-solver', weight: 10, theme: 'sharp', companyWide: true },
      { id: 'ai_ego', name: 'Team-first', weight: 10, theme: 'lowEgo', companyWide: true },
    ],
    mustHaves: [],
  },
  {
    id: 'fullstack',
    title: 'Full Stack Engineer',
    summary: 'Ships features across the stack, leaning towards backend and AI.',
    criteria: [
      { id: 'fs_backend', name: 'Backend depth', weight: 25 },
      {
        id: 'fs_builder',
        name: 'Builder (side projects, hackathons, open source)',
        weight: 25,
        theme: 'builder',
        companyWide: true,
      },
      { id: 'fs_versatile', name: 'Works across frontend, backend and AI', weight: 15 },
      { id: 'fs_pedigree', name: 'Academic distinction (honours or similar)', weight: 10, theme: 'pedigree' },
      { id: 'fs_independent', name: 'Self-directed', weight: 10 },
      { id: 'fs_sharp', name: 'Curious problem-solver', weight: 10, theme: 'sharp', companyWide: true },
      { id: 'fs_ego', name: 'Team-first', weight: 5, theme: 'lowEgo', companyWide: true },
    ],
    mustHaves: [],
  },
  {
    id: 'head-eng',
    title: 'Head of Engineering',
    summary: 'Builds the first products hands-on, then grows the team and the architecture.',
    criteria: [
      {
        id: 'he_builder',
        name: 'Builder (shipped products people use)',
        weight: 25,
        theme: 'builder',
        companyWide: true,
      },
      { id: 'he_scale', name: 'Has scaled systems and teams', weight: 20 },
      { id: 'he_hands', name: 'Still hands-on (full stack + AI)', weight: 15 },
      { id: 'he_rt', name: 'Real-time or developer API platforms', weight: 15 },
      { id: 'he_first', name: 'Simplifies complex systems', weight: 15 },
      { id: 'he_sharp', name: 'Curious problem-solver', weight: 5, theme: 'sharp', companyWide: true },
      { id: 'he_ego', name: 'Team-first', weight: 5, theme: 'lowEgo', companyWide: true },
    ],
    mustHaves: [],
  },
  {
    id: 'bizops',
    title: 'Business Operations',
    summary: 'Runs the company’s operating systems: suppliers, onboarding, tools and decision support.',
    criteria: [
      {
        id: 'bo_builder',
        name: 'Builder (automates repeated work)',
        weight: 25,
        theme: 'builder',
        companyWide: true,
      },
      { id: 'bo_process', name: 'Owns operations end to end (4–6 yrs)', weight: 20 },
      { id: 'bo_precision', name: 'Precise and detail-oriented', weight: 15 },
      { id: 'bo_decision', name: 'Clear written recommendations', weight: 15 },
      { id: 'bo_sharp', name: 'Curious problem-solver', weight: 15, theme: 'sharp', companyWide: true },
      { id: 'bo_ego', name: 'Team-first', weight: 10, theme: 'lowEgo', companyWide: true },
    ],
    mustHaves: [{ id: 'rtw', label: 'Right to work in the UK', enabled: true }],
  },
  {
    id: 'talent',
    title: 'Talent Partner',
    summary: 'Owns hiring end to end, from direct sourcing to a structured interview process.',
    criteria: [
      { id: 'tp_reader', name: 'Spots real builders behind polished CVs', weight: 25 },
      {
        id: 'tp_builder',
        name: 'Builder (has set up a hiring process)',
        weight: 20,
        theme: 'builder',
        companyWide: true,
      },
      { id: 'tp_sourcing', name: 'Direct sourcing (LinkedIn, referrals)', weight: 15 },
      { id: 'tp_tenure', name: '5–8 yrs recruiting, incl. technical roles', weight: 15 },
      {
        id: 'tp_sharp',
        name: 'Curious problem-solver (writes plainly)',
        weight: 15,
        theme: 'sharp',
        companyWide: true,
      },
      { id: 'tp_ego', name: 'Team-first', weight: 10, theme: 'lowEgo', companyWide: true },
    ],
    mustHaves: [{ id: 'rtw', label: 'Right to work in the UK', enabled: true }],
  },
];

/** Roles with each criterion's description and example phrases attached. */
export const SEED_ROLES: Role[] = ROLES.map((r) => ({
  ...r,
  criteria: r.criteria.map((c) => ({ ...c, ...CRITERION_TEXT[c.id] })),
}));

/** Qualities every role shares. A new role starts with these three. */
export const COMPANY_WIDE_QUALITIES = [
  { theme: 'builder' as const, name: 'Builder', weight: 40, description: 'Has built or shipped something real, not only maintained it.' },
  { theme: 'sharp' as const, name: 'Curious problem-solver', weight: 30, description: 'Enjoys hard, open-ended problems; clear and concise.' },
  { theme: 'lowEgo' as const, name: 'Team-first', weight: 30, description: 'Shares credit, takes feedback, changes their mind on good reasoning.' },
];
