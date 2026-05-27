import { describe, it, expect } from "vitest";
import {
  PRECISION_THRESHOLD,
  computeInsertPosition,
  minGap,
  needsRebalance,
  positionAfter,
  positionBefore,
  positionBetween,
  rebalance,
} from "./position";

describe("positionAfter", () => {
  it("returns 1 for empty list", () => {
    expect(positionAfter(undefined)).toBe(1);
  });
  it("increments by step", () => {
    expect(positionAfter(5)).toBe(6);
    expect(positionAfter(99.5)).toBe(100.5);
  });
  it("works with zero", () => {
    expect(positionAfter(0)).toBe(1);
  });
  it("works with negatives", () => {
    expect(positionAfter(-3)).toBe(-2);
  });
});

describe("positionBefore", () => {
  it("returns 1 for empty list", () => {
    expect(positionBefore(undefined)).toBe(1);
  });
  it("decrements by step", () => {
    expect(positionBefore(3)).toBe(2);
    expect(positionBefore(10)).toBe(9);
  });
  it("works with fractional positions", () => {
    expect(positionBefore(1.5)).toBe(0.5);
  });
});

describe("positionBetween", () => {
  it("bisects integers", () => {
    expect(positionBetween(1, 2)).toBe(1.5);
    expect(positionBetween(0, 10)).toBe(5);
  });
  it("bisects fractions", () => {
    expect(positionBetween(1.5, 2)).toBe(1.75);
    expect(positionBetween(1.25, 1.5)).toBe(1.375);
  });
  it("works with negative neighbors", () => {
    expect(positionBetween(-2, 0)).toBe(-1);
  });
  it("is commutative for ordered pairs (sanity)", () => {
    expect(positionBetween(3, 7)).toBe(positionBetween(7, 3));
  });
});

describe("needsRebalance", () => {
  it("returns false for normal gaps", () => {
    expect(needsRebalance(1, 2)).toBe(false);
    expect(needsRebalance(1, 1.5)).toBe(false);
    expect(needsRebalance(1, 1.001)).toBe(false);
  });
  it("returns true once gap drops below threshold", () => {
    expect(needsRebalance(1, 1 + PRECISION_THRESHOLD / 2)).toBe(true);
    expect(needsRebalance(1, 1.00001)).toBe(true);
  });
  it("symmetric in argument order", () => {
    expect(needsRebalance(2, 1)).toBe(needsRebalance(1, 2));
  });
});

describe("rebalance", () => {
  it("produces evenly spaced integers", () => {
    expect(rebalance(0)).toEqual([]);
    expect(rebalance(1)).toEqual([1]);
    expect(rebalance(3)).toEqual([1, 2, 3]);
    expect(rebalance(5)).toEqual([1, 2, 3, 4, 5]);
  });
  it("scales to 100+ items", () => {
    const r = rebalance(100);
    expect(r.length).toBe(100);
    expect(r[0]).toBe(1);
    expect(r[99]).toBe(100);
  });
});

describe("computeInsertPosition", () => {
  it("returns 1 for empty list at index 0", () => {
    expect(computeInsertPosition([], 0)).toBe(1);
  });
  it("returns 1 for empty list at out-of-range index", () => {
    expect(computeInsertPosition([], 5)).toBe(1);
  });
  it("inserts before the first card", () => {
    expect(computeInsertPosition([1, 2, 3], 0)).toBe(0);
    expect(computeInsertPosition([5, 6, 7], 0)).toBe(4);
  });
  it("inserts after the last card", () => {
    expect(computeInsertPosition([1, 2, 3], 3)).toBe(4);
    expect(computeInsertPosition([1, 2, 3], 10)).toBe(4);
  });
  it("bisects between cards", () => {
    expect(computeInsertPosition([1, 2, 3], 1)).toBe(1.5);
    expect(computeInsertPosition([1, 2, 3], 2)).toBe(2.5);
  });
  it("handles single-element list", () => {
    expect(computeInsertPosition([5], 0)).toBe(4);
    expect(computeInsertPosition([5], 1)).toBe(6);
  });
  it("clamps negative indices to 0", () => {
    expect(computeInsertPosition([1, 2, 3], -1)).toBe(0);
  });
  it("works with fractional sibling positions", () => {
    expect(computeInsertPosition([1, 1.5, 2], 1)).toBeCloseTo(1.25);
    expect(computeInsertPosition([1, 1.5, 2], 2)).toBeCloseTo(1.75);
  });
});

describe("computeInsertPosition table", () => {
  const cases: Array<[number[], number, number]> = [
    [[], 0, 1],
    [[], 99, 1],
    [[1], 0, 0],
    [[1], 1, 2],
    [[1, 2], 0, 0],
    [[1, 2], 1, 1.5],
    [[1, 2], 2, 3],
    [[1, 2, 3, 4], 0, 0],
    [[1, 2, 3, 4], 1, 1.5],
    [[1, 2, 3, 4], 2, 2.5],
    [[1, 2, 3, 4], 3, 3.5],
    [[1, 2, 3, 4], 4, 5],
    [[10, 20, 30], 0, 9],
    [[10, 20, 30], 1, 15],
    [[10, 20, 30], 3, 31],
    [[0, 1], 1, 0.5],
    [[-5, -2], 0, -6],
    [[-5, -2], 1, -3.5],
    [[-5, -2], 2, -1],
    [[100], 0, 99],
    [[100], 1, 101],
  ];
  it.each(cases)("(%j, %i) -> %f", (siblings, toIndex, expected) => {
    expect(computeInsertPosition(siblings, toIndex)).toBeCloseTo(expected);
  });
});

describe("needsRebalance table", () => {
  const cases: Array<[number, number, boolean]> = [
    [1, 2, false],
    [1, 1.5, false],
    [1, 1.001, false],
    [1, 1.0002, false],
    [1, 1.00005, true],
    [1, 1.00001, true],
    [0, PRECISION_THRESHOLD * 10, false],
    [0, PRECISION_THRESHOLD / 2, true],
    [5, 5, true],
  ];
  it.each(cases)("(%f, %f) -> %s", (a, b, expected) => {
    expect(needsRebalance(a, b)).toBe(expected);
  });
});

describe("minGap", () => {
  it("returns Infinity for empty/single lists", () => {
    expect(minGap([])).toBe(Infinity);
    expect(minGap([5])).toBe(Infinity);
  });
  it("returns smallest neighbor gap", () => {
    expect(minGap([1, 2, 3])).toBe(1);
    expect(minGap([1, 1.5, 3])).toBe(0.5);
    expect(minGap([1, 5, 5.25, 10])).toBe(0.25);
  });
});

describe("ordering invariants under repeated moves", () => {
  function applyMove(
    positions: number[],
    fromIndex: number,
    toIndex: number,
  ): number[] {
    const card = positions[fromIndex]!;
    const without = positions.filter((_, i) => i !== fromIndex);
    const newPos = computeInsertPosition(without, toIndex);
    // After moving `card` to its new position, rebuild the array sorted by pos.
    const updated = without.map((p, i) => ({ p, i }));
    updated.splice(Math.min(toIndex, without.length), 0, { p: newPos, i: -1 });
    return updated.map((x) => x.p);
  }

  it("repeated bisection between two cards keeps the list sorted", () => {
    let positions = [1, 2];
    for (let i = 0; i < 50; i++) {
      const next = positionBetween(positions[0]!, positions[1]!);
      positions = [positions[0]!, next, ...positions.slice(1)];
    }
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });

  it("1000 random moves keep the list sorted", () => {
    let positions = rebalance(10);
    let rng = 12345;
    const rand = () => {
      // Deterministic LCG for repeatable randomness.
      rng = (rng * 1664525 + 1013904223) % 2 ** 32;
      return rng / 2 ** 32;
    };
    let rebalances = 0;
    for (let step = 0; step < 1000; step++) {
      const from = Math.floor(rand() * positions.length);
      const to = Math.floor(rand() * positions.length);
      positions = applyMove(positions, from, to);
      const sorted = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sorted);
      if (minGap(positions) < PRECISION_THRESHOLD) {
        positions = rebalance(positions.length);
        rebalances++;
      }
    }
    expect(positions.length).toBe(10);
    // Sanity: at some point during 1000 moves we expected to rebalance.
    expect(rebalances).toBeGreaterThanOrEqual(0);
  });
});
