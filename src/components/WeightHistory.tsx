import { History, Sparkles } from 'lucide-react';
import { useAppState } from '../state/AppState';
import { EmptyState } from './EmptyState';

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `Today ${time}` : `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

export function WeightHistory() {
  const { state } = useAppState();
  const roleTitle = (id: string) => state.roles.find((r) => r.id === id)?.title ?? id;

  return (
    <section className="card p-5" aria-labelledby="history-h">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-500" aria-hidden />
        <h2 id="history-h" className="font-semibold text-navy-900">Weight history</h2>
      </div>
      {state.weightHistory.length === 0 ? (
        <EmptyState icon={History} title="No changes yet">
          Move a slider, add a criterion, or accept a suggestion on the Learning page — it will be logged here.
        </EmptyState>
      ) : (
        <ol className="space-y-3">
          {state.weightHistory.map((h) => (
            <li key={h.id} className="flex gap-3 text-sm">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${h.source === 'learning' ? 'bg-teal-500' : 'bg-slate-400'}`}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="text-navy-900">{h.description}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                  <span>{formatTime(h.at)}</span>
                  <span>·</span>
                  <span>{roleTitle(h.roleId)}</span>
                  {h.source === 'learning' && (
                    <span className="chip bg-teal-50 text-teal-700">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      From Learning
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
