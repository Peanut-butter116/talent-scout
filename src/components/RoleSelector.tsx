import { useAppState } from '../state/AppState';

export function RoleSelector({ label = 'Role' }: { label?: string }) {
  const { state, dispatch } = useAppState();
  return (
    <div className="mb-6">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Select role">
        {state.roles.map((r) => {
          const active = r.id === state.selectedRoleId;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={active}
              data-tour={`role-${r.id}`}
              onClick={() => dispatch({ type: 'SELECT_ROLE', roleId: r.id })}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-navy-800 bg-navy-800 text-white'
                  : 'border-slate-300 bg-white text-navy-700 hover:border-navy-400'
              }`}
            >
              {r.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
