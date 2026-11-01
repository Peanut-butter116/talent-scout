import { useMemo } from 'react';
import { analyzeRole, type CriterionAnalysis } from '../lib/analysis';
import { rankCandidates, type SortMode } from '../lib/scoring';
import type { Role } from '../types';
import { useAppState } from './AppState';

export function useRoleAnalysis(role: Role): CriterionAnalysis[] {
  const { state } = useAppState();
  return useMemo(
    () => analyzeRole(role, state.roles, state.candidates, state.chats),
    [role, state.roles, state.candidates, state.chats],
  );
}

export function useRanked(role: Role, sort: SortMode = 'cautious') {
  const { state } = useAppState();
  return useMemo(() => rankCandidates(state.candidates, role, sort), [state.candidates, role, sort]);
}
