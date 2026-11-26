"use client";

import { track } from "@/lib/daily";
import { isSynthesisSupported, speak } from "@/lib/speech";

type Props = { text: string; className?: string };

/** A small round 🔊 button that reads an English word aloud. Renders nothing where the browser has no speech. */
export default function SpeakButton({ text, className = "" }: Props) {
  if (!isSynthesisSupported()) return null;
  return (
    <button
      type="button"
      onClick={() => {
        void speak(text, { rate: 0.8 });
        track("listen");
      }}
      aria-label={`Nghe cách đọc “${text}”`}
      title="Nghe cách đọc"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-sm transition-colors hover:border-wine/40 active:bg-wine/10 ${className}`}
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}
