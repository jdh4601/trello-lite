import { describe, it, expect } from "vitest";
import { loginSchema, passwordSchema, signupSchema } from "./schemas";

describe("passwordSchema", () => {
  it.each([
    ["valid: 8 chars with letter and digit", "abcdef12", true],
    ["valid: longer", "MySecurePass123!", true],
    ["too short", "abc12", false],
    ["no digit", "abcdefgh", false],
    ["no letter", "12345678", false],
    ["empty", "", false],
  ])("%s", (_label, input, expected) => {
    expect(passwordSchema.safeParse(input).success).toBe(expected);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      name: "Alice",
      password: "abcdef12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      name: "Alice",
      password: "abcdef12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      name: "",
      password: "abcdef12",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login (no password complexity check)", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});
