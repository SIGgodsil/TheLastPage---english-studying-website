"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseProgress, readProgressRaw, subscribeProgress, type Progress } from "@/lib/storage";

/**
 * The learner's saved progress, or null while rendering on the server (and
 * during hydration), where localStorage does not exist.
 */
export function useProgress(): Progress | null {
  // The raw string is the snapshot: equal strings mean nothing changed.
  const raw = useSyncExternalStore(subscribeProgress, readProgressRaw, () => undefined);
  return useMemo(() => (raw === undefined ? null : parseProgress(raw)), [raw]);
}
