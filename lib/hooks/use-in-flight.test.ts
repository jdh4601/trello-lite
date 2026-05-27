// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInFlight } from "./use-in-flight";

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useInFlight", () => {
  it("runs the supplied function and exposes inFlight=true while pending", async () => {
    const { promise, resolve } = deferred();
    const fn = vi.fn(() => promise);

    const { result } = renderHook(() => useInFlight());
    expect(result.current.inFlight).toBe(false);

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.run(fn);
    });
    expect(result.current.inFlight).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve();
      await runPromise;
    });
    expect(result.current.inFlight).toBe(false);
  });

  it("rejects re-entrant calls while the first run is still in flight", async () => {
    const { promise, resolve } = deferred();
    const fn = vi.fn(() => promise);

    const { result } = renderHook(() => useInFlight());

    let firstRun!: Promise<void>;
    act(() => {
      firstRun = result.current.run(fn);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    // Simulate a second invocation in the same tick — the latest closure of
    // submit() in a real component would call run() again, hitting the guard.
    let secondRun!: Promise<void>;
    act(() => {
      secondRun = result.current.run(fn);
    });
    await secondRun;

    // Critical assertion: the second call MUST NOT have invoked fn.
    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve();
      await firstRun;
    });
  });

  it("clears the guard on success so subsequent runs work", async () => {
    const fn = vi.fn(async () => {});
    const { result } = renderHook(() => useInFlight());

    await act(async () => {
      await result.current.run(fn);
    });
    await act(async () => {
      await result.current.run(fn);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("clears the guard on failure so the user can retry", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("first failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useInFlight());

    await act(async () => {
      await expect(result.current.run(fn)).rejects.toThrow("first failed");
    });
    expect(result.current.inFlight).toBe(false);

    await act(async () => {
      await result.current.run(fn);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
