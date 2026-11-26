"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseDaily, readDailyRaw, subscribeDaily, type Daily } from "@/lib/daily";

/**
 * The daily streak and missions state, or null while rendering on the server
 * (and during hydration), where localStorage does not exist.
 */
export function useDaily(): Daily | null {
  const raw = useSyncExternalStore(subscribeDaily, readDailyRaw, () => undefined);
  return useMemo(() => (raw === undefined ? null : parseDaily(raw)), [raw]);
}
