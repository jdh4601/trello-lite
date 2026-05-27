/**
 * Fractional indexing for ordered lists.
 *
 * Storing the order as a Float lets a single item move with one UPDATE:
 *   - Between A and B: (A + B) / 2
 *   - Top:    first - 1
 *   - Bottom: last + 1
 *
 * Repeated bisection halves the gap each time, so we monitor for precision
 * loss and rebalance an entire list back to 1, 2, 3, ... when neighbors get
 * too close.
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
 * Returns true when neighbors are too close — the caller should rebalance
 * the affected list to integer positions instead of bisecting further.
 */
export function needsRebalance(prev: number, next: number): boolean {
  return Math.abs(next - prev) < PRECISION_THRESHOLD;
}

/**
 * Compute the rebalanced positions for an ordered set of items.
 * Returns positions for each item in the same order they were given.
 */
export function rebalance(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_STEP);
}
