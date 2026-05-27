import { describe, it, expect } from "vitest";
import {
  needsRebalance,
  positionAfter,
  positionBefore,
  positionBetween,
  rebalance,
} from "./position";

describe("position helpers", () => {
  it("positionAfter handles empty list", () => {
    expect(positionAfter(undefined)).toBe(1);
  });

  it("positionAfter increments by step", () => {
    expect(positionAfter(5)).toBe(6);
  });

  it("positionBefore handles empty list", () => {
    expect(positionBefore(undefined)).toBe(1);
  });

  it("positionBefore decrements", () => {
    expect(positionBefore(3)).toBe(2);
  });

  it("positionBetween bisects", () => {
    expect(positionBetween(1, 2)).toBe(1.5);
    expect(positionBetween(1.5, 2)).toBe(1.75);
  });

  it("needsRebalance triggers below threshold", () => {
    expect(needsRebalance(1, 1.5)).toBe(false);
    expect(needsRebalance(1, 1.00001)).toBe(true);
  });

  it("rebalance produces evenly spaced integers", () => {
    expect(rebalance(0)).toEqual([]);
    expect(rebalance(3)).toEqual([1, 2, 3]);
    expect(rebalance(5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("repeated bisection stays sorted until needing rebalance", () => {
    const positions = [1, 2];
    for (let i = 0; i < 10; i++) {
      const next = positionBetween(positions[0]!, positions[1]!);
      positions.splice(1, 0, next);
    }
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });
});
