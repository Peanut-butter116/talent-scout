import { useAppState } from '../state/AppState';

export function RoleSelector({ label = 'Role' }: { label?: string }) {
  const { state, dispatch } = useAppState();
  return (
    <div className="mb-10">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={`Select ${label.toLowerCase()}`}>
        {state.roles.map((r) => {
          const active = r.id === state.selectedRoleId;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={active}
              data-tour={`role-${r.id}`}
              onClick={() => dispatch({ type: 'SELECT_ROLE', roleId: r.id })}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${
                active ? 'bg-ink-900 font-medium text-white' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
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
