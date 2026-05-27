import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes a password to a non-empty string distinct from the input", async () => {
    const hash = await hashPassword("hunter2-123");
    expect(hash).toBeTypeOf("string");
    expect(hash).not.toBe("hunter2-123");
    expect(hash.length).toBeGreaterThan(50);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("hunter2-123");
    await expect(verifyPassword("hunter2-123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("hunter2-123");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const a = await hashPassword("same-input-9");
    const b = await hashPassword("same-input-9");
    expect(a).not.toBe(b);
    await expect(verifyPassword("same-input-9", a)).resolves.toBe(true);
    await expect(verifyPassword("same-input-9", b)).resolves.toBe(true);
  });
});
