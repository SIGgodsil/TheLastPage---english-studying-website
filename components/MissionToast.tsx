"use client";

import { useEffect, useRef, useState } from "react";
import { onMissionDone } from "@/lib/daily";

const SHOW_MS = 3500;

/**
 * A short note at the bottom of the screen when a daily mission is done.
 * It is a manual popover, so it sits in the top layer and stays visible even
 * above an open sheet (the shadowing sheet is a modal <dialog>).
 */
export default function MissionToast() {
  const [message, setMessage] = useState<{ text: string; star: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: number | undefined;
    const off = onMissionDone(({ completed, allDoneNow }) => {
      const text = allDoneNow
        ? "Xong cả 3 nhiệm vụ hôm nay! Giỏi quá!"
        : `Xong nhiệm vụ: ${completed.map((m) => m.titleVi).join(", ")}`;
      setMessage({ text, star: allDoneNow });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), SHOW_MS);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);

  // Show or hide in the top layer where the browser supports popovers.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (message && !el.matches(":popover-open")) el.showPopover();
      if (!message && el.matches(":popover-open")) el.hidePopover();
    } catch {
      // Older browsers: the element simply shows in place.
    }
  }, [message]);

  return (
    <div
      ref={ref}
      popover="manual"
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-auto bottom-[calc(6rem+env(safe-area-inset-bottom))] mx-auto my-0 w-fit max-w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 ${message ? "" : "hidden"}`}
    >
      {message && (
        <p className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[0.95rem] text-paper shadow-[0_12px_32px_-12px_rgb(43_36_32/0.6)] motion-safe:animate-[pop-in_160ms_ease-out]">
          <span aria-hidden>{message.star ? "⭐" : "✓"}</span>
          {message.text}
        </p>
      )}
    </div>
  );
}
