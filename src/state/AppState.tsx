import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { clearRankMemory } from './rankMemory';
import { createSeedState, loadState, reducer, saveState, STORAGE_KEY, type Action, type AppState } from './reducer';

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

  // Another tab (e.g. /review opened from this browser) saved changes: pick them up live.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      dispatch({ type: 'HYDRATE', state: loadState(getStorage()) });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const resetDemo = useCallback(() => {
    clearRankMemory();
    // Also forget per-tab extras: tour position and in-progress CEO review sessions.
    try {
      for (const k of Object.keys(sessionStorage)) if (k.startsWith('talent-scout:')) sessionStorage.removeItem(k);
    } catch {
      // ignore
    }
    dispatch({ type: 'RESET' });
  }, []);
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
