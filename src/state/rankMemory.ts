/**
 * Remembers the last ranking the visitor saw per role (in memory only), so the
 * Candidates page can highlight rows that moved — even after a weight change on another page.
 */
const lastSeen = new Map<string, Map<string, number>>();

export function diffRanks(roleId: string, current: Map<string, number>): Record<string, number> {
  const prev = lastSeen.get(roleId);
  lastSeen.set(roleId, current);
  if (!prev) return {};
  const moved: Record<string, number> = {};
  for (const [id, rank] of current) {
    const p = prev.get(id);
    if (p !== undefined && p !== rank) moved[id] = p - rank;
  }
  return moved;
}

/** Records a baseline ranking if none exists yet (e.g. weights changed before visiting Candidates). */
export function rememberIfUnseen(roleId: string, current: Map<string, number>) {
  if (!lastSeen.has(roleId)) lastSeen.set(roleId, current);
}
