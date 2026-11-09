import { BarChart3, Info, KanbanSquare, ListChecks, Menu, RotateCcw, Search, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { Footer } from './Disclaimer';
import { ImportDecisions } from './ImportDecisions';
import { TourProvider, useTour } from './Tour';

const NAV = [
  { to: '/roles', label: 'Roles & Criteria', icon: ListChecks },
  { to: '/sourcing', label: 'Sourcing', icon: Search },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/learning', label: 'Learning', icon: BarChart3 },
];

export function Layout() {
  return (
    <TourProvider>
      <Shell />
    </TourProvider>
  );
}

function TourLink({ className }: { className: string }) {
  const { start } = useTour();
  return (
    <button className={className} onClick={start}>
      Tour
    </button>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  // New page → start at the top (unless jumping to an anchor).
  useEffect(() => {
    if (!location.hash || location.hash.includes('=')) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-white">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            className="-ml-2 rounded-full p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Brand />
          <div className="ml-auto flex items-center gap-4">
            <TourLink className="text-sm text-ink-500 hover:text-ink-900" />
            <NavLink to="/about" className="text-sm text-ink-500 hover:text-ink-900">About</NavLink>
          </div>
        </div>
      </header>

      {open && <div className="fixed inset-0 z-30 bg-ink-950/20 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="lg:flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white px-3 pb-4 pt-5 shadow-xl transition-transform lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-3.5rem)] lg:w-56 lg:translate-x-0 lg:shadow-none ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 px-3 lg:hidden">
            <Brand />
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={`nav-${to.slice(1)}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-ink-100 font-medium text-ink-900' : 'text-ink-500 hover:text-ink-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-0.5">
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                }`
              }
            >
              <Info className="h-4 w-4" aria-hidden />
              About
            </NavLink>
            <ResetButton />
          </div>
        </aside>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none px-4 pb-6 pt-8 sm:px-8 lg:px-12 lg:pt-10">
          <div className="mx-auto max-w-5xl">
            <Outlet />
            <Footer />
          </div>
        </main>
      </div>
      <ImportDecisions />
    </div>
  );
}

export function Brand() {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[15px] font-semibold tracking-tightish text-ink-900">Talent Scout</span>
      <span className="text-sm text-ink-400">· Interactive demo</span>
    </div>
  );
}

function ResetButton() {
  const { resetDemo } = useAppState();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="rounded-2xl bg-ink-50 p-3 text-sm">
        <p className="mb-2 text-ink-700">Reset all edits?</p>
        <div className="flex gap-2">
          <button
            className="btn-primary px-3 py-1.5"
            onClick={() => {
              resetDemo();
              setConfirming(false);
            }}
          >
            Reset
          </button>
          <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      className="flex items-center gap-3 rounded-full px-3 py-2 text-left text-sm text-ink-500 transition-colors hover:text-ink-900"
      onClick={() => setConfirming(true)}
    >
      <RotateCcw className="h-4 w-4" aria-hidden />
      Reset demo
    </button>
  );
}
