/**
 * Remembers the last ranking the visitor saw per role, so the Candidates page can highlight
 * rows that moved — even after a weight change on another page or a page reload.
 * Kept in sessionStorage (this tab only); falls back to memory if storage is blocked.
 */
const KEY = 'talent-scout:rank-baseline';
const memory = new Map<string, Record<string, number>>();

function readAll(): Record<string, Record<string, number>> {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Record<string, Record<string, number>>;
  } catch {
    // ignore
  }
  return Object.fromEntries(memory);
}

function write(roleId: string, ranks: Map<string, number>) {
  const obj = Object.fromEntries(ranks);
  memory.set(roleId, obj);
  try {
    const all = readAll();
    all[roleId] = obj;
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore — memory copy still works for this page view
  }
}

export function diffRanks(roleId: string, current: Map<string, number>): Record<string, number> {
  const prev = readAll()[roleId];
  write(roleId, current);
  if (!prev) return {};
  const moved: Record<string, number> = {};
  for (const [id, rank] of current) {
    const p = prev[id];
    if (p !== undefined && p !== rank) moved[id] = p - rank;
  }
  return moved;
}

/** Records a baseline ranking if none exists yet (e.g. weights changed before visiting Candidates). */
export function rememberIfUnseen(roleId: string, current: Map<string, number>) {
  if (!readAll()[roleId]) write(roleId, current);
}

export function clearRankMemory() {
  memory.clear();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
