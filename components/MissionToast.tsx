"use client";

import { useEffect, useRef, useState } from "react";
import { onMissionDone } from "@/lib/daily";

const SHOW_MS = 3500;
/** The all-done message stays a little longer. */
const SHOW_STAR_MS = 5000;
/** Where the celebration stars start (percent across the toast) and their delay. */
const STARS = [
  { left: 8, delay: 0 },
  { left: 30, delay: 140 },
  { left: 52, delay: 60 },
  { left: 74, delay: 200 },
  { left: 92, delay: 100 },
];

/**
 * A short note near the top of the screen (below the chat header, clear of
 * the chat's buttons) when a daily mission is done.
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
        ? "Xong cả 3 nhiệm vụ hôm nay!"
        : `Xong nhiệm vụ: ${completed.map((m) => m.titleVi).join(", ")}`;
      setMessage({ text, star: allDoneNow });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), allDoneNow ? SHOW_STAR_MS : SHOW_MS);
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
      className={`fixed inset-x-0 top-[calc(4.75rem+env(safe-area-inset-top))] bottom-auto mx-auto my-0 w-fit max-w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 ${message ? "" : "hidden"}`}
    >
      {message && (
        <div className="relative">
          <p
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 leading-snug text-[0.95rem] shadow-[0_12px_32px_-12px_rgb(43_36_32/0.6)] motion-safe:animate-[pop-in_160ms_ease-out] ${
              message.star ? "bg-wine text-paper" : "bg-ink text-paper"
            }`}
          >
            <span aria-hidden>{message.star ? "⭐" : "✓"}</span>
            {message.text}
          </p>
          {/* A small burst of stars; left out entirely when the learner prefers less motion. */}
          {message.star &&
            STARS.map((star) => (
              <span
                key={star.left}
                aria-hidden
                className="pointer-events-none absolute top-0 hidden text-sm opacity-0 motion-safe:inline motion-safe:animate-[star-rise_1100ms_ease-out_both]"
                style={{ left: `${star.left}%`, animationDelay: `${star.delay}ms` }}
              >
                ⭐
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
