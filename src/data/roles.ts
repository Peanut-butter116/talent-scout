import type { Role } from '../types';
import { CRITERION_TEXT } from './criteriaText';

/**
 * Roles are paraphrased from Glot's public job ads.
 * Weights in each role sum to 100.
 */
const ROLES: Role[] = [
  {
    id: 'ai-eng',
    jdUrl: 'https://jobs.ashbyhq.com/glot/f529d4cb-dec4-4db8-987b-acc64bec9782',
    title: 'Founding AI Engineer',
    summary:
      'Owns AI direction and model architecture, and sits on the senior leadership committee.',
    criteria: [
      { id: 'ai_model', name: 'Deep hands-on model building (beyond fine-tuning)', weight: 25 },
      { id: 'ai_rt', name: 'Real-time / speech / translation / low-latency inference', weight: 25 },
      {
        id: 'ai_pedigree',
        name: 'High-bar background (top research lab or early-stage AI team)',
        weight: 10,
        theme: 'pedigree',
      },
      { id: 'ai_judgement', name: 'Judgement on hard-to-reverse decisions', weight: 10 },
      { id: 'ai_builder', name: 'Builder', weight: 10, theme: 'builder', glotWide: true },
      { id: 'ai_sharp', name: 'Sharp & curious', weight: 10, theme: 'sharp', glotWide: true },
      { id: 'ai_ego', name: 'Low ego', weight: 10, theme: 'lowEgo', glotWide: true },
    ],
    mustHaves: [],
  },
  {
    id: 'fullstack',
    jdUrl: 'https://jobs.ashbyhq.com/glot/e1dfbeef-d771-4cc2-9d32-404a9c7311d6',
    title: 'Full Stack Engineer',
    summary: 'Versatile across AI, backend and frontend, with a lean towards backend.',
    criteria: [
      { id: 'fs_backend', name: 'Backend depth', weight: 25 },
      {
        id: 'fs_builder',
        name: 'Builder (side projects, hackathons, things built outside class/work)',
        weight: 25,
        theme: 'builder',
        glotWide: true,
      },
      { id: 'fs_versatile', name: 'Full-stack versatility incl. AI', weight: 15 },
      {
        id: 'fs_pedigree',
        name: 'Top-of-field signal (honours or equivalent)',
        weight: 10,
        theme: 'pedigree',
      },
      { id: 'fs_independent', name: 'Figures things out independently', weight: 10 },
      { id: 'fs_sharp', name: 'Sharp & curious', weight: 10, theme: 'sharp', glotWide: true },
      { id: 'fs_ego', name: 'Low ego', weight: 5, theme: 'lowEgo', glotWide: true },
    ],
    mustHaves: [],
  },
  {
    id: 'head-eng',
    jdUrl: 'https://jobs.ashbyhq.com/glot/1efd6395-c9d0-44e3-8195-4390745161f2',
    title: 'Head of Engineering',
    summary:
      'Ships impactful products: hands-on early, then scales the architecture to a team. First-principles; makes the complex simple.',
    criteria: [
      {
        id: 'he_builder',
        name: 'Builder (shipped impactful products)',
        weight: 25,
        theme: 'builder',
        glotWide: true,
      },
      { id: 'he_scale', name: 'Scaling architecture and teams', weight: 20 },
      { id: 'he_hands', name: 'Hands-on across full stack + AI', weight: 15 },
      {
        id: 'he_rt',
        name: 'Real-time audio or developer-facing API platforms (strong plus)',
        weight: 15,
      },
      { id: 'he_first', name: 'First-principles, simplifies complexity', weight: 15 },
      { id: 'he_sharp', name: 'Sharp & curious', weight: 5, theme: 'sharp', glotWide: true },
      { id: 'he_ego', name: 'Low ego', weight: 5, theme: 'lowEgo', glotWide: true },
    ],
    mustHaves: [],
  },
  {
    id: 'bizops',
    jdUrl: 'https://jobs.ashbyhq.com/glot/c1278e4e-078f-47c0-920d-2ce93234350c',
    title: 'Business Operations',
    summary:
      'Generalist working with the Chief of Staff on systems, suppliers, onboarding, registers and decision support.',
    criteria: [
      {
        id: 'bo_builder',
        name: 'Builder (turns repeated tasks into systems)',
        weight: 25,
        theme: 'builder',
        glotWide: true,
      },
      {
        id: 'bo_process',
        name: 'End-to-end process ownership (4–6 yrs consulting/startup ops)',
        weight: 20,
      },
      { id: 'bo_precision', name: 'Precision and attention to detail', weight: 15 },
      {
        id: 'bo_decision',
        name: 'Clear decision support (one-page briefs, recommendations)',
        weight: 15,
      },
      { id: 'bo_sharp', name: 'Sharp & curious', weight: 15, theme: 'sharp', glotWide: true },
      { id: 'bo_ego', name: 'Low ego', weight: 10, theme: 'lowEgo', glotWide: true },
    ],
    mustHaves: [{ id: 'rtw', label: 'Right to work in UK', enabled: true }],
  },
  {
    id: 'talent',
    jdUrl: 'https://jobs.ashbyhq.com/glot/ebd0691d-9abd-46b2-9ae5-5eaa3cc807f8',
    title: 'Talent Partner',
    summary:
      'Owns hiring end to end: sourcing, screening and running the pipeline in Ashby.',
    criteria: [
      { id: 'tp_reader', name: 'Reader of people (polished profile vs real builder)', weight: 25 },
      {
        id: 'tp_builder',
        name: 'Builder (set up/improved a hiring process)',
        weight: 20,
        theme: 'builder',
        glotWide: true,
      },
      { id: 'tp_sourcing', name: 'Direct sourcing via LinkedIn and networks', weight: 15 },
      { id: 'tp_tenure', name: '5–8 yrs recruiting incl. technical roles', weight: 15 },
      {
        id: 'tp_sharp',
        name: 'Sharp & curious (writes plainly, direct)',
        weight: 15,
        theme: 'sharp',
        glotWide: true,
      },
      { id: 'tp_ego', name: 'Low ego', weight: 10, theme: 'lowEgo', glotWide: true },
    ],
    mustHaves: [{ id: 'rtw', label: 'Right to work in UK', enabled: true }],
  },
];

/** Roles with each criterion's description and example phrases attached. */
export const SEED_ROLES: Role[] = ROLES.map((r) => ({
  ...r,
  criteria: r.criteria.map((c) => ({ ...c, ...CRITERION_TEXT[c.id] })),
}));

export const GLOT_WIDE_QUALITIES = [
  {
    name: 'Sharp & curious',
    description: 'Energised by hard, ambiguous problems; gets to the point.',
  },
  {
    name: 'Builder',
    description:
      'Has built or shipped something real (project, system, product), not only maintained one.',
  },
  {
    name: 'Low ego',
    description: 'Here to build, not to be seen building; changes mind when reasoning is sound.',
  },
];
