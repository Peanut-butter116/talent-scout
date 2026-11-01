import { Inbox } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { decodeResultsHash, isResultsHash, planImport, summarise, type Parsed, type ResultsLink } from '../lib/share';
import { useAppState } from '../state/AppState';

/** Opening a CEO results link shows "Import CEO decisions?" and applies them on confirm. */
export function ImportDecisions() {
  const { state, dispatch } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const [parsed, setParsed] = useState<Parsed<ResultsLink> | null>(null);

  useEffect(() => {
    if (isResultsHash(location.hash)) setParsed(decodeResultsHash(location.hash));
  }, [location.hash]);

  if (!parsed) return null;
  const close = () => {
    setParsed(null);
    navigate({ pathname: location.pathname, hash: '' }, { replace: true });
  };

  let body;
  if (!parsed.ok) {
    body = (
      <>
        <h2 className="text-lg font-semibold text-ink-900">Can't import this link</h2>
        <p className="mt-1 text-sm text-ink-500">{parsed.error}</p>
        <div className="mt-6 flex justify-end">
          <button className="btn-primary" onClick={close}>OK</button>
        </div>
      </>
    );
  } else {
    const r = parsed.value;
    const { apply, ignored } = planImport(state.candidates, r);
    const applicable = Object.fromEntries(apply.map((id) => [id, r.decisions[id]]));
    const s = summarise(applicable);
    const name = (id: string) => state.candidates.find((c) => c.id === id)?.name ?? id;
    body = (
      <>
        <h2 className="text-lg font-semibold text-ink-900">Import CEO decisions?</h2>
        <p className="mt-1 text-sm text-ink-500">
          {s.approved} approved · {s.priority} priority · {s.skipped} skipped
        </p>
        {apply.length > 0 && <p className="mt-3 text-sm text-ink-600">{apply.map(name).join(', ')}</p>}
        {ignored.length > 0 && (
          <p className="mt-2 text-xs text-ink-400">{ignored.length} already moved on — left as is.</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={close}>Cancel</button>
          <button
            className="btn-primary"
            disabled={apply.length === 0}
            onClick={() => {
              dispatch({ type: 'IMPORT_DECISIONS', results: r });
              setParsed(null);
              navigate({ pathname: '/pipeline', hash: '' }, { replace: true });
            }}
          >
            Import
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/30 p-4" role="dialog" aria-modal="true" aria-label="Import CEO decisions">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <Inbox className="mb-3 h-5 w-5 text-ink-900" aria-hidden />
        {body}
      </div>
    </div>
  );
}
