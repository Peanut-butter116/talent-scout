import { BarChart3, Info, KanbanSquare, ListChecks, Menu, RotateCcw, ScanSearch, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { Footer } from './Disclaimer';

const NAV = [
  { to: '/roles', label: 'Roles & Criteria', icon: ListChecks },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/learning', label: 'Learning', icon: BarChart3 },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-800 bg-navy-900 px-4 py-3 text-white lg:hidden">
        <Brand />
        <button
          className="rounded-lg p-2 hover:bg-navy-800"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-navy-100 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="hidden px-5 pt-6 pb-4 lg:block">
          <Brand />
        </div>
        <div className="px-5 pt-5 pb-2 text-[11px] font-medium uppercase tracking-wider text-navy-400 lg:pt-2">
          Weekly hiring loop
        </div>
        <nav className="flex flex-col gap-1 px-3" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-tour={`nav-${to.slice(1)}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-navy-800 text-white' : 'text-navy-200 hover:bg-navy-800/60 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-teal-300' : ''}`} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-navy-800 px-3 py-4">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-navy-800 text-white' : 'text-navy-300 hover:bg-navy-800/60 hover:text-white'
              }`
            }
          >
            <Info className="h-4 w-4" aria-hidden />
            About this project
          </NavLink>
          <ResetButton />
          <p className="px-3 pt-2 text-[11px] leading-snug text-navy-400">
            Unofficial concept demo — not a Glot product. All candidates are fictional.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
          <Footer />
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
        <ScanSearch className="h-4 w-4" aria-hidden />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">Talent Scout</div>
        <div className="text-[11px] text-navy-300">Concept for Glot</div>
      </div>
    </div>
  );
}

function ResetButton() {
  const { resetDemo } = useAppState();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="rounded-lg bg-navy-800 p-3 text-sm">
        <p className="mb-2 text-navy-100">Reset all edits to the original demo data?</p>
        <div className="flex gap-2">
          <button
            className="btn bg-teal-500 px-2.5 py-1.5 text-navy-950 hover:bg-teal-400"
            onClick={() => {
              resetDemo();
              setConfirming(false);
            }}
          >
            Reset
          </button>
          <button className="btn px-2.5 py-1.5 text-navy-200 hover:bg-navy-700" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-navy-300 transition-colors hover:bg-navy-800/60 hover:text-white"
      onClick={() => setConfirming(true)}
    >
      <RotateCcw className="h-4 w-4" aria-hidden />
      Reset demo
    </button>
  );
}
