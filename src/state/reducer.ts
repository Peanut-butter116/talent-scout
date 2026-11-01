import { SEED_CANDIDATES } from '../data/candidates';
import { SEED_CHATS } from '../data/chats';
import { SEED_ROLES } from '../data/roles';
import type { RubricSuggestion } from '../lib/analysis';
import { pickShortlist } from '../lib/pipeline';
import { planImport, type ResultsLink } from '../lib/share';
import { addCriterion, applyWeightChanges, removeCriterion, setWeight } from '../lib/weights';
import type {
  Candidate,
  ChatFeedback,
  MustHaveValue,
  PipelineStatus,
  ReviewDecision,
  ReviewEntry,
  Role,
  SkipReason,
  WeightChange,
} from '../types';

/** Bump both whenever the saved-state shape changes, so old saved state resets cleanly. */
export const STATE_VERSION = 4;
export const STORAGE_KEY = 'talent-scout:v4';

export interface AppState {
  version: number;
  roles: Role[];
  candidates: Candidate[];
  chats: ChatFeedback[];
  weightHistory: WeightChange[];
  dismissedSuggestions: string[];
  reviewLog: ReviewEntry[];
  selectedRoleId: string;
  welcomeSeen: boolean;
}

const deepCopy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export function createSeedState(): AppState {
  return {
    version: STATE_VERSION,
    roles: deepCopy(SEED_ROLES),
    candidates: deepCopy(SEED_CANDIDATES),
    chats: deepCopy(SEED_CHATS),
    weightHistory: [],
    dismissedSuggestions: [],
    reviewLog: [],
    selectedRoleId: SEED_ROLES[0].id,
    welcomeSeen: false,
  };
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SELECT_ROLE'; roleId: string }
  | { type: 'SET_WEIGHT'; roleId: string; criterionId: string; weight: number; at?: string }
  | { type: 'RENAME_CRITERION'; roleId: string; criterionId: string; name: string }
  | { type: 'ADD_CRITERION'; roleId: string; name: string; id?: string; at?: string }
  | { type: 'REMOVE_CRITERION'; roleId: string; criterionId: string; at?: string }
  | { type: 'TOGGLE_MUST_HAVE'; roleId: string; mustHaveId: string }
  | {
      type: 'SET_STATUS';
      candidateIds: string[];
      status: PipelineStatus;
      skipReason?: SkipReason;
      at?: string;
    }
  | { type: 'GENERATE_SHORTLIST'; roleId: string | null; at?: string }
  | {
      type: 'REVIEW_DECISION';
      candidateId: string;
      decision: ReviewDecision;
      reason?: SkipReason;
      at?: string;
    }
  | { type: 'UNDO_REVIEW' }
  | { type: 'IMPORT_DECISIONS'; results: ResultsLink; at?: string }
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SET_REPLIED'; candidateId: string; replied: boolean }
  | { type: 'SET_MUST_HAVE_VALUE'; candidateId: string; mustHaveId: string; value: MustHaveValue }
  | { type: 'LOG_CHAT'; chat: ChatFeedback }
  | { type: 'ACCEPT_SUGGESTION'; suggestion: RubricSuggestion; at?: string }
  | { type: 'DISMISS_SUGGESTION'; key: string }
  | { type: 'SET_WELCOME_SEEN' };

/** Slider moves on the same criterion within this window merge into one history entry. */
const MERGE_WINDOW_MS = 10_000;

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

function updateRole(state: AppState, roleId: string, fn: (r: Role) => Role): AppState {
  return { ...state, roles: state.roles.map((r) => (r.id === roleId ? fn(r) : r)) };
}

function logChange(state: AppState, entry: Omit<WeightChange, 'id'>): AppState {
  return { ...state, weightHistory: [{ id: uid('w'), ...entry }, ...state.weightHistory] };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET':
      return { ...createSeedState(), welcomeSeen: true };

    case 'SELECT_ROLE':
      return state.roles.some((r) => r.id === action.roleId)
        ? { ...state, selectedRoleId: action.roleId }
        : state;

    case 'SET_WEIGHT': {
      const role = state.roles.find((r) => r.id === action.roleId);
      const crit = role?.criteria.find((c) => c.id === action.criterionId);
      if (!role || !crit) return state;
      const at = action.at ?? new Date().toISOString();
      const next = updateRole(state, role.id, (r) => ({
        ...r,
        criteria: setWeight(r.criteria, crit.id, action.weight),
      }));
      const newWeight = next.roles.find((r) => r.id === role.id)!.criteria.find(
        (c) => c.id === crit.id,
      )!.weight;
      if (newWeight === crit.weight) return next;

      const last = state.weightHistory[0];
      const canMerge =
        last &&
        last.source === 'manual' &&
        last.roleId === role.id &&
        last.criterionId === crit.id &&
        new Date(at).getTime() - new Date(last.at).getTime() < MERGE_WINDOW_MS;
      const from = canMerge ? (last.from ?? crit.weight) : crit.weight;
      if (canMerge && from === newWeight) {
        // Slider returned to where it started: drop the entry.
        return { ...next, weightHistory: state.weightHistory.slice(1) };
      }
      const entry: Omit<WeightChange, 'id'> = {
        at,
        roleId: role.id,
        source: 'manual',
        criterionId: crit.id,
        from,
        to: newWeight,
        description: `${crit.name}: ${from} → ${newWeight} (others rebalanced)`,
      };
      if (canMerge) {
        return {
          ...next,
          weightHistory: [{ ...last, ...entry }, ...state.weightHistory.slice(1)],
        };
      }
      return logChange(next, entry);
    }

    case 'RENAME_CRITERION': {
      const name = action.name.trim();
      if (!name) return state;
      return updateRole(state, action.roleId, (r) => ({
        ...r,
        criteria: r.criteria.map((c) => (c.id === action.criterionId ? { ...c, name } : c)),
      }));
    }

    case 'ADD_CRITERION': {
      const name = action.name.trim();
      const role = state.roles.find((r) => r.id === action.roleId);
      if (!name || !role) return state;
      const id = action.id ?? uid('crit');
      const next = updateRole(state, role.id, (r) => ({
        ...r,
        criteria: addCriterion(r.criteria, { id, name }),
      }));
      return logChange(next, {
        at: action.at ?? new Date().toISOString(),
        roleId: role.id,
        source: 'manual',
        description: `Added “${name}” at 10 (others rebalanced)`,
      });
    }

    case 'REMOVE_CRITERION': {
      const role = state.roles.find((r) => r.id === action.roleId);
      const crit = role?.criteria.find((c) => c.id === action.criterionId);
      if (!role || !crit || role.criteria.length <= 1) return state;
      const next = updateRole(state, role.id, (r) => ({
        ...r,
        criteria: removeCriterion(r.criteria, crit.id),
      }));
      return logChange(next, {
        at: action.at ?? new Date().toISOString(),
        roleId: role.id,
        source: 'manual',
        description: `Removed “${crit.name}” (was ${crit.weight}; others rebalanced)`,
      });
    }

    case 'TOGGLE_MUST_HAVE':
      return updateRole(state, action.roleId, (r) => ({
        ...r,
        mustHaves: r.mustHaves.map((m) =>
          m.id === action.mustHaveId ? { ...m, enabled: !m.enabled } : m,
        ),
      }));

    case 'SET_STATUS': {
      const at = action.at ?? new Date().toISOString();
      const ids = new Set(action.candidateIds);
      return {
        ...state,
        candidates: state.candidates.map((c) => {
          if (!ids.has(c.id)) return c;
          const next: Candidate = { ...c, status: action.status };
          if (action.status === 'suggested' || action.status === 'approved') {
            next.shortlistedAt = c.shortlistedAt ?? at;
          }
          if (action.status === 'contacted') next.contactedAt = c.contactedAt ?? at;
          if (action.status === 'new') {
            delete next.shortlistedAt;
            delete next.contactedAt;
          }
          if (action.status === 'skipped') {
            if (action.skipReason) next.skipReason = action.skipReason;
          } else {
            delete next.skipReason;
          }
          return next;
        }),
      };
    }

    case 'GENERATE_SHORTLIST': {
      const ids = pickShortlist(state.candidates, state.roles, action.roleId);
      if (ids.length === 0) return state;
      return reducer(state, { type: 'SET_STATUS', candidateIds: ids, status: 'suggested', at: action.at });
    }

    case 'REVIEW_DECISION': {
      const cand = state.candidates.find((c) => c.id === action.candidateId);
      if (!cand) return state;
      const at = action.at ?? new Date().toISOString();
      const entry: ReviewEntry = {
        id: uid('rev'),
        candidateId: cand.id,
        roleId: cand.roleId,
        decision: action.decision,
        reason: action.reason,
        at,
        prev: { status: cand.status, priority: cand.priority, skipReason: cand.skipReason },
      };
      const status: PipelineStatus = action.decision === 'skip' ? 'skipped' : 'approved';
      const next = reducer(state, {
        type: 'SET_STATUS',
        candidateIds: [cand.id],
        status,
        skipReason: action.reason,
        at,
      });
      return {
        ...next,
        candidates: next.candidates.map((c) =>
          c.id === cand.id ? { ...c, priority: action.decision === 'priority' ? true : undefined } : c,
        ),
        reviewLog: [...state.reviewLog, entry],
      };
    }

    case 'UNDO_REVIEW': {
      const last = state.reviewLog[state.reviewLog.length - 1];
      if (!last) return state;
      return {
        ...state,
        reviewLog: state.reviewLog.slice(0, -1),
        candidates: state.candidates.map((c) => {
          if (c.id !== last.candidateId) return c;
          const restored: Candidate = { ...c, status: last.prev.status };
          if (last.prev.priority) restored.priority = true;
          else delete restored.priority;
          if (last.prev.skipReason) restored.skipReason = last.prev.skipReason;
          else delete restored.skipReason;
          return restored;
        }),
      };
    }

    case 'IMPORT_DECISIONS': {
      const { apply } = planImport(state.candidates, action.results);
      let next = state;
      for (const id of apply) {
        const d = action.results.decisions[id];
        next = reducer(next, { type: 'REVIEW_DECISION', candidateId: id, decision: d.decision, reason: d.reason, at: action.at });
      }
      return next;
    }

    case 'HYDRATE':
      return action.state;

    case 'SET_REPLIED':
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.candidateId ? { ...c, replied: action.replied } : c,
        ),
      };

    case 'SET_MUST_HAVE_VALUE':
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.candidateId
            ? { ...c, mustHaves: { ...c.mustHaves, [action.mustHaveId]: action.value } }
            : c,
        ),
      };

    case 'LOG_CHAT':
      return {
        ...state,
        chats: [
          ...state.chats.filter((c) => c.candidateId !== action.chat.candidateId),
          action.chat,
        ],
        candidates: state.candidates.map((c) =>
          c.id === action.chat.candidateId ? { ...c, status: 'done' } : c,
        ),
      };

    case 'ACCEPT_SUGGESTION': {
      const { suggestion } = action;
      const role = state.roles.find((r) => r.id === suggestion.roleId);
      if (!role) return state;
      const next = updateRole(state, role.id, (r) => ({
        ...r,
        criteria: applyWeightChanges(r.criteria, [
          { criterionId: suggestion.lower.criterionId, to: suggestion.lower.to },
          { criterionId: suggestion.raise.criterionId, to: suggestion.raise.to },
        ]),
      }));
      return logChange(next, {
        at: action.at ?? new Date().toISOString(),
        roleId: role.id,
        source: 'learning',
        description: `Accepted from Learning: ${suggestion.lower.name} ${suggestion.lower.from} → ${suggestion.lower.to}, ${suggestion.raise.name} ${suggestion.raise.from} → ${suggestion.raise.to}`,
      });
    }

    case 'DISMISS_SUGGESTION':
      return state.dismissedSuggestions.includes(action.key)
        ? state
        : { ...state, dismissedSuggestions: [...state.dismissedSuggestions, action.key] };

    case 'SET_WELCOME_SEEN':
      return { ...state, welcomeSeen: true };

    default:
      return state;
  }
}

/** Loads saved state; falls back to seed if missing, corrupt or from an older version. */
export function loadState(storage: Pick<Storage, 'getItem'> | undefined): AppState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed?.version !== STATE_VERSION || !Array.isArray(parsed.roles)) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(storage: Pick<Storage, 'setItem'> | undefined, state: AppState) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): the demo still works for this visit.
  }
}
