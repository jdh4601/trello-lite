import { describe, it, expect } from "vitest";
import { createBoardSchema, updateBoardSchema } from "./board";

describe("createBoardSchema", () => {
  it("accepts a valid name", () => {
    expect(createBoardSchema.safeParse({ name: "기말 프로젝트" }).success).toBe(true);
  });

  it("trims whitespace and rejects empty after trim", () => {
    expect(createBoardSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects names over 80 chars", () => {
    expect(createBoardSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
  });
});

describe("updateBoardSchema", () => {
  it("accepts empty object (no fields to update)", () => {
    expect(updateBoardSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid partial update", () => {
    expect(updateBoardSchema.safeParse({ name: "renamed" }).success).toBe(true);
  });
});
