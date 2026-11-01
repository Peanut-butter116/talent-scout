import type { ChatFeedback } from '../types';

/**
 * Ten fictional completed coffee chats, so the Learning page has data on load.
 *
 * Designed story:
 * - Pedigree-style criteria ("High-bar background", "Top-of-field signal") are NOT
 *   supported: high scorers did no better than others.
 * - Builder IS holding up: high Builder scorers progressed far more often.
 * - Profiles overstated "Sharp & curious" (polished profiles read sharper than the chat).
 */
export const SEED_CHATS: ChatFeedback[] = [
  {
    id: 'chat-theo',
    candidateId: 'c-theo',
    roleId: 'ai-eng',
    outcome: 'not_fit',
    observed: { ai_model: 3, ai_rt: 2, ai_builder: 1, ai_sharp: 2 },
    note: 'Impressive papers, but struggled to walk through anything shipped to users.',
    at: '2026-10-09T16:00:00.000Z',
  },
  {
    id: 'chat-sam',
    candidateId: 'c-sam',
    roleId: 'ai-eng',
    outcome: 'progress',
    observed: { ai_model: 4, ai_rt: 4, ai_builder: 5, ai_sharp: 4, ai_ego: 4, ai_judgement: 4 },
    note: 'Explained latency trade-offs from first principles. Clear builder.',
    at: '2026-10-09T16:30:00.000Z',
  },
  {
    id: 'chat-harriet',
    candidateId: 'c-harriet',
    roleId: 'fullstack',
    outcome: 'not_fit',
    observed: { fs_backend: 3, fs_builder: 1, fs_sharp: 2, fs_independent: 2 },
    note: 'Strong on paper; little curiosity beyond assigned tickets.',
    at: '2026-10-16T16:00:00.000Z',
  },
  {
    id: 'chat-kai',
    candidateId: 'c-kai',
    roleId: 'fullstack',
    outcome: 'progress',
    observed: { fs_backend: 4, fs_builder: 5, fs_versatile: 4, fs_independent: 5, fs_sharp: 4 },
    note: 'Demoed three things they built. Asked sharp questions about our stack.',
    at: '2026-10-16T16:30:00.000Z',
  },
  {
    id: 'chat-casey',
    candidateId: 'c-casey',
    roleId: 'head-eng',
    outcome: 'not_fit',
    observed: { he_builder: 2, he_scale: 3, he_hands: 1, he_first: 2, he_ego: 2, he_sharp: 2 },
    note: 'Great at org charts; could not go deep on any technical decision.',
    at: '2026-10-09T17:00:00.000Z',
  },
  {
    id: 'chat-robin',
    candidateId: 'c-robin',
    roleId: 'head-eng',
    outcome: 'progress',
    observed: { he_builder: 5, he_hands: 5, he_rt: 5, he_first: 4, he_sharp: 4, he_ego: 5 },
    note: 'Sketched our real-time architecture on the spot. Wants to stay hands-on.',
    at: '2026-10-16T17:00:00.000Z',
  },
  {
    id: 'chat-frankie',
    candidateId: 'c-frankie',
    roleId: 'bizops',
    outcome: 'maybe',
    observed: { bo_builder: 2, bo_process: 4, bo_precision: 4, bo_decision: 3, bo_sharp: 2 },
    note: 'Solid operator. Unsure they would build new systems unprompted.',
    at: '2026-10-16T17:30:00.000Z',
  },
  {
    id: 'chat-jamie',
    candidateId: 'c-jamie',
    roleId: 'bizops',
    outcome: 'maybe',
    observed: { bo_builder: 5, bo_process: 2, bo_decision: 4, bo_sharp: 3 },
    note: 'Built great systems; light on supplier and register experience.',
    at: '2026-10-09T17:30:00.000Z',
  },
  {
    id: 'chat-blake',
    candidateId: 'c-blake',
    roleId: 'talent',
    outcome: 'not_fit',
    observed: { tp_reader: 2, tp_builder: 2, tp_sourcing: 1, tp_sharp: 2 },
    note: 'Lots of years, but relies on agencies and job boards.',
    at: '2026-10-09T18:00:00.000Z',
  },
  {
    id: 'chat-charlie',
    candidateId: 'c-charlie',
    roleId: 'talent',
    outcome: 'progress',
    observed: { tp_reader: 4, tp_builder: 5, tp_sourcing: 5, tp_sharp: 3 },
    note: 'Walked through how they spotted two overlooked engineers. Builds process.',
    at: '2026-10-16T18:00:00.000Z',
  },
];
