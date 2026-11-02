import { Check, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isResultsHash } from '../lib/share';
import { useAppState } from '../state/AppState';
import type { AppState } from '../state/reducer';

/**
 * A light, custom guided tour of the core loop. Max 6 steps, skippable, mobile-friendly.
 * Each step goes to a page, outlines the thing to try, and ticks itself when you've done it.
 */
interface Step {
  route: string;
  target: string;
  text: string;
  roleId?: string;
  /** Snapshot taken when the step starts; `done` compares against it. */
  done?: (s: AppState, base: Snapshot) => boolean;
}

interface Snapshot {
  weights: number;
  added: number;
  suggested: number;
  chats: number;
  learning: number;
}

const snap = (s: AppState): Snapshot => ({
  weights: s.weightHistory.length,
  added: s.candidates.filter((c) => c.addedBy === 'you').length,
  suggested: s.candidates.filter((c) => c.status === 'suggested').length + s.reviewLog.length,
  chats: s.chats.length,
  learning: s.weightHistory.filter((h) => h.source === 'learning').length,
});

export const TOUR_STEPS: Step[] = [
  {
    route: '/roles',
    target: 'first-weight',
    roleId: 'ai-eng',
    text: 'Drag the first weight for Founding AI Engineer.',
    done: (s, b) => s.weightHistory.length > b.weights,
  },
  {
    route: '/candidates',
    target: 'candidates-list',
    roleId: 'ai-eng',
    text: 'The ranking updates — rows that moved are highlighted.',
  },
  {
    route: '/how-it-works',
    target: 'live-example',
    text: 'See exactly how scores are calculated — and try the weights yourself.',
  },
  {
    route: '/sourcing',
    target: 'try-example',
    text: 'Try an example profile, check the suggestions, then save.',
    done: (s, b) => snap(s).added > b.added,
  },
  {
    route: '/pipeline',
    target: 'generate',
    text: 'Generate the shortlist, then open the CEO review.',
    done: (s, b) => snap(s).suggested > b.suggested,
  },
  {
    route: '/learning',
    target: 'log-feedback',
    text: 'Log a coffee chat — it takes about 30 seconds.',
    done: (s, b) => s.chats.length > b.chats,
  },
  {
    route: '/learning',
    target: 'accept-suggestion',
    roleId: 'ai-eng',
    text: 'Accept the suggested change to the rubric.',
    done: (s, b) => snap(s).learning > b.learning,
  },
];

interface TourCtx {
  start: () => void;
  active: boolean;
}
const Ctx = createContext<TourCtx>({ start: () => {}, active: false });
export const useTour = () => useContext(Ctx);

const KEY = 'talent-scout:tour-step';
/** localStorage flag: set as soon as a tour starts, so it never auto-starts again in this browser. */
export const TOUR_SEEN_KEY = 'talent-scout:tour-seen';

function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return true; // storage blocked: don't keep auto-starting
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<number | null>(() => {
    try {
      const v = sessionStorage.getItem(KEY);
      return v === null ? null : Number(v);
    } catch {
      return null;
    }
  });
  const base = useRef<Snapshot>(snap(state));

  const go = useCallback(
    (i: number | null) => {
      setStep(i);
      try {
        if (i === null) sessionStorage.removeItem(KEY);
        else sessionStorage.setItem(KEY, String(i));
      } catch {
        // ignore
      }
      if (i === null || i >= TOUR_STEPS.length) return;
      const s = TOUR_STEPS[i];
      base.current = snap(state);
      if (s.roleId && state.selectedRoleId !== s.roleId) dispatch({ type: 'SELECT_ROLE', roleId: s.roleId });
      navigate(s.route);
    },
    [dispatch, navigate, state],
  );

  const start = useCallback(() => {
    markTourSeen();
    dispatch({ type: 'SET_WELCOME_SEEN' });
    go(0);
  }, [dispatch, go]);

  // First visit in this browser: start the tour straight away — but never on About or on a
  // CEO results/import link (/review has no tour at all).
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || step !== null || tourSeen()) return;
    if (location.pathname.startsWith('/about') || isResultsHash(location.hash)) return;
    autoStarted.current = true;
    start();
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = step !== null && step < TOUR_STEPS.length ? TOUR_STEPS[step] : null;
  const done = current?.done ? current.done(state, base.current) : false;

  // Outline the step's target once it's on screen (pages may load lazily).
  useEffect(() => {
    if (!current || location.pathname !== current.route) return;
    let el: Element | null = null;
    let tries = 0;
    const find = () => {
      el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) {
        el.classList.add('tour-target');
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return true;
      }
      return false;
    };
    if (find()) return () => el?.classList.remove('tour-target');
    const t = window.setInterval(() => {
      if (find() || ++tries > 20) window.clearInterval(t);
    }, 250);
    return () => {
      window.clearInterval(t);
      el?.classList.remove('tour-target');
    };
  }, [current, location.pathname, step]);

  const value = useMemo(() => ({ start, active: step !== null }), [start, step]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {step !== null && (
        <div
          className="fixed inset-x-3 bottom-3 z-[45] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80"
          role="dialog"
          aria-label="Guided tour"
        >
          <div className="rounded-3xl bg-ink-900 p-5 text-white shadow-2xl">
            {current ? (
              <>
                <div className="flex items-center justify-between text-xs text-ink-300">
                  <span>
                    Tour · {step + 1} of {TOUR_STEPS.length}
                  </span>
                  <button className="-mr-1 rounded-full p-1 hover:text-white" onClick={() => go(null)} aria-label="Skip tour">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {step === 0 && (
                  <p className="mt-2 text-sm text-ink-300">
                    Welcome to Talent Scout — a weekly shortlist that learns which hiring criteria really work. Candidates are
                    fictional; your edits stay in this browser.
                  </p>
                )}
                <p className="mt-2 text-[15px] leading-snug">
                  {done && <Check className="-mt-0.5 mr-1.5 inline h-4 w-4 text-teal-300" aria-label="Done" />}
                  {current.text}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {step > 0 && (
                    <button className="rounded-full px-3 py-1.5 text-sm text-ink-300 hover:text-white" onClick={() => go(step - 1)}>
                      Back
                    </button>
                  )}
                  <button className="rounded-full px-3 py-1.5 text-sm text-ink-300 hover:text-white" onClick={() => go(null)}>
                    Skip
                  </button>
                  <button
                    className={`ml-auto rounded-full px-4 py-1.5 text-sm font-medium ${done || !current.done ? 'bg-white text-ink-900' : 'bg-white/15 text-white hover:bg-white/25'}`}
                    onClick={() => go(step + 1)}
                  >
                    {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium">That's the loop.</p>
                <p className="mt-1 text-sm text-ink-300">Criteria → ranking → review → chats → better criteria.</p>
                <div className="mt-4 flex items-center gap-2">
                  <Link to="/about" className="rounded-full px-3 py-1.5 text-sm text-ink-300 underline underline-offset-4 hover:text-white" onClick={() => go(null)}>
                    Read more
                  </Link>
                  <button className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-medium text-ink-900" onClick={() => go(null)}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
