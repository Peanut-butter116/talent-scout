import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { createSeedState, loadState, reducer, saveState, type Action, type AppState } from './reducer';

interface Ctx {
  state: AppState;
  dispatch: (a: Action) => void;
  resetDemo: () => void;
}

const AppStateContext = createContext<Ctx | null>(null);

function getStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function AppStateProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initial ?? loadState(getStorage()) ?? createSeedState(),
  );

  useEffect(() => {
    saveState(getStorage(), state);
  }, [state]);

  const resetDemo = useCallback(() => dispatch({ type: 'RESET' }), []);
  const value = useMemo(() => ({ state, dispatch, resetDemo }), [state, resetDemo]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

export function useSelectedRole() {
  const { state } = useAppState();
  return state.roles.find((r) => r.id === state.selectedRoleId) ?? state.roles[0];
}
