import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signSession, verifySession } from "./jwt";

const ORIGINAL_SECRET = process.env.JWT_SECRET;
const TEST_SECRET = "test-secret-test-secret-test-secret-1234";

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

afterAll(() => {
  process.env.JWT_SECRET = ORIGINAL_SECRET;
});

describe("JWT session", () => {
  it("signs and verifies a session token roundtrip", async () => {
    const token = await signSession({ sub: "user_abc", email: "a@b.com" });
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    const payload = await verifySession(token);
    expect(payload).toEqual({ sub: "user_abc", email: "a@b.com" });
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({ sub: "u1", email: "x@y.com" });
    const tampered = `${token}aaa`;
    await expect(verifySession(tampered)).rejects.toThrow();
  });

  it("rejects a token signed with a different secret", async () => {
    process.env.JWT_SECRET = "different-secret-different-secret-different-1";
    const token = await signSession({ sub: "u2", email: "z@y.com" });
    process.env.JWT_SECRET = TEST_SECRET;
    await expect(verifySession(token)).rejects.toThrow();
  });
});
