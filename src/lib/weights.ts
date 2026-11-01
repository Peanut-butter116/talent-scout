import type { Criterion } from '../types';

export const TOTAL_WEIGHT = 100;

/**
 * Splits `total` across items in proportion to `shares`, as whole numbers that sum exactly
 * to `total` (largest-remainder method). Equal split if all shares are zero.
 */
export function apportion(shares: number[], total: number): number[] {
  if (shares.length === 0) return [];
  const sum = shares.reduce((a, b) => a + b, 0);
  const base = sum > 0 ? shares : shares.map(() => 1);
  const baseSum = sum > 0 ? sum : shares.length;
  const exact = base.map((s) => (s / baseSum) * total);
  const floors = exact.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i] += 1;
    remainder -= 1;
  }
  return floors;
}

/**
 * Sets one criterion's weight and rescales the others proportionally so the total stays 100.
 */
export function setWeight(criteria: Criterion[], id: string, newWeight: number): Criterion[] {
  const target = criteria.find((c) => c.id === id);
  if (!target) return criteria;
  if (criteria.length === 1) return criteria.map((c) => ({ ...c, weight: TOTAL_WEIGHT }));

  const w = Math.round(Math.min(TOTAL_WEIGHT, Math.max(0, newWeight)));
  const others = criteria.filter((c) => c.id !== id);
  const rest = apportion(
    others.map((c) => c.weight),
    TOTAL_WEIGHT - w,
  );
  let k = 0;
  return criteria.map((c) => (c.id === id ? { ...c, weight: w } : { ...c, weight: rest[k++] }));
}

/** Adds a criterion with a starting weight, scaling the others down proportionally. */
export function addCriterion(
  criteria: Criterion[],
  criterion: Omit<Criterion, 'weight'>,
  weight = 10,
): Criterion[] {
  const next = [...criteria, { ...criterion, weight: 0 }];
  if (criteria.length === 0) return next.map((c) => ({ ...c, weight: TOTAL_WEIGHT }));
  return setWeight(next, criterion.id, weight);
}

/** Removes a criterion and spreads its weight proportionally over the rest. */
export function removeCriterion(criteria: Criterion[], id: string): Criterion[] {
  const rest = criteria.filter((c) => c.id !== id);
  if (rest.length === 0) return rest;
  const weights = apportion(
    rest.map((c) => c.weight),
    TOTAL_WEIGHT,
  );
  return rest.map((c, i) => ({ ...c, weight: weights[i] }));
}

/**
 * Applies an explicit set of weight changes (e.g. an accepted rubric suggestion) without
 * touching other criteria. Caller is responsible for the changes summing to zero.
 */
export function applyWeightChanges(
  criteria: Criterion[],
  changes: { criterionId: string; to: number }[],
): Criterion[] {
  return criteria.map((c) => {
    const ch = changes.find((x) => x.criterionId === c.id);
    return ch ? { ...c, weight: ch.to } : c;
  });
}

export function totalWeight(criteria: Criterion[]): number {
  return criteria.reduce((a, c) => a + c.weight, 0);
}
