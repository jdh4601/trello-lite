/**
 * Fractional indexing for ordered lists.
 *
 * Stored as Float so a single move is one UPDATE:
 *   - Between A and B: (A + B) / 2
 *   - Top:    first - 1
 *   - Bottom: last + 1
 *
 * Repeated bisection halves the gap each time; once neighbors get too close
 * we rebalance the whole list back to 1, 2, 3, ...
 */

export const POSITION_STEP = 1;
export const PRECISION_THRESHOLD = 1e-4;

export function positionAfter(last: number | undefined): number {
  return (last ?? 0) + POSITION_STEP;
}

export function positionBefore(first: number | undefined): number {
  return (first ?? POSITION_STEP * 2) - POSITION_STEP;
}

export function positionBetween(prev: number, next: number): number {
  return (prev + next) / 2;
}

/**
 * True when neighbors are too close — caller should rebalance the affected
 * list to integer positions instead of bisecting further.
 */
export function needsRebalance(prev: number, next: number): boolean {
  return Math.abs(next - prev) < PRECISION_THRESHOLD;
}

/** Rebalanced integer positions for a list of `count` items. */
export function rebalance(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_STEP);
}

/**
 * Compute the target position for a card moving to `toIndex` in a list whose
 * remaining cards are `siblingPositions` (in order, EXCLUDING the moving card).
 *
 * Examples:
 *   siblingPositions = [1, 2, 3]
 *   toIndex = 0 → 0    (before 1)
 *   toIndex = 1 → 1.5  (between 1 and 2)
 *   toIndex = 3 → 4    (after 3)
 */
export function computeInsertPosition(
  siblingPositions: readonly number[],
  toIndex: number,
): number {
  const n = siblingPositions.length;
  const clamped = Math.max(0, Math.min(toIndex, n));

  if (n === 0) return POSITION_STEP;
  if (clamped === 0) return positionBefore(siblingPositions[0]);
  if (clamped === n) return positionAfter(siblingPositions[n - 1]);
  return positionBetween(siblingPositions[clamped - 1]!, siblingPositions[clamped]!);
}

/**
 * Walk a sorted list and find the smallest neighbor gap.
 * Returns Infinity for lists with <2 elements.
 */
export function minGap(sorted: readonly number[]): number {
  let min = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.abs(sorted[i]! - sorted[i - 1]!);
    if (gap < min) min = gap;
  }
  return min;
}
