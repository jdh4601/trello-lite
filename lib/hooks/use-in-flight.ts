"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Guards an async action against re-entry while it is already running.
 *
 * Why a ref alongside state? React batches `setState` and applies it on the
 * next render, so a `submitting` value read from closure can still be `false`
 * for a second handler invocation that fires in the same tick (rapid Enter,
 * double-click before the disabled prop renders). The ref flips synchronously,
 * which is what an idempotency check needs.
 *
 * Exposes `inFlight` for UI affordances (disabling buttons, swapping labels).
 */
export function useInFlight() {
  const [inFlight, setInFlight] = useState(false);
  const ref = useRef(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (ref.current) return undefined;
    ref.current = true;
    setInFlight(true);
    try {
      return await fn();
    } finally {
      ref.current = false;
      setInFlight(false);
    }
  }, []);

  return { inFlight, run };
}
