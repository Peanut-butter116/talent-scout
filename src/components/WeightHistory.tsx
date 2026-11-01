import { useAppState } from '../state/AppState';

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
    <section aria-labelledby="history-h">
      <h2 id="history-h" className="mb-4 text-lg font-semibold text-ink-900">History</h2>
      {state.weightHistory.length === 0 ? (
        <p className="text-sm text-ink-400">No changes yet.</p>
      ) : (
        <ol className="space-y-4">
          {state.weightHistory.map((h) => (
            <li key={h.id} className="text-sm">
              <div className="text-ink-800">{h.description}</div>
              <div className="mt-0.5 text-xs text-ink-400">
                {formatTime(h.at)} · {roleTitle(h.roleId)}
                {h.source === 'learning' && <span className="ml-1.5 font-medium text-teal-700">From Learning</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
