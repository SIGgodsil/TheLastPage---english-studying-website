"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { WordInfo } from "@/lib/dictionary";

type Props = {
  /** The word as it appears in the text, e.g. "buries". */
  shown: string;
  /** Its dictionary key, e.g. "bury". */
  wordKey: string;
  entry?: WordInfo;
  /** The tapped word: the popover sits just above or below it. */
  anchor: HTMLElement;
  pageNumber: number;
  onClose: () => void;
};

const GAP = 8;
const EDGE = 12;
/** Room kept for the sticky chat header at the top of the screen. */
const TOP_BAR = 64;

/**
 * A small card with a word's meaning, shown right next to the word. Closes on
 * Esc, on a tap elsewhere or on ✕; follows the word while the page scrolls.
 */
export default function WordPopover({ shown, wordKey, entry, anchor, pageNumber, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Place the card above the word when there is room, otherwise below; keep it on screen.
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const place = () => {
      const word = anchor.getBoundingClientRect();
      const { innerWidth: vw, innerHeight: vh } = window;
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const left = Math.min(Math.max(word.left + word.width / 2 - width / 2, EDGE), vw - EDGE - width);
      const above = word.top - GAP - height >= TOP_BAR;
      const top = above ? word.top - GAP - height : word.bottom + GAP;
      card.style.left = `${left}px`;
      card.style.top = `${Math.min(Math.max(top, EDGE), vh - EDGE - height)}px`;
      card.style.visibility = "visible";
    };
    place();
    window.addEventListener("scroll", place, { passive: true, capture: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [anchor]);

  // Mark the tapped word while its meaning is open.
  useEffect(() => {
    anchor.setAttribute("data-active", "true");
    return () => anchor.removeAttribute("data-active");
  }, [anchor]);

  // Focus the card so screen readers announce it; Esc or a tap elsewhere closes it.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      if (anchor instanceof HTMLButtonElement) anchor.focus({ preventScroll: true });
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [anchor, onClose]);

  /** Set for story key words: the page that introduced them. */
  const introduced = entry?.page;
  // The same word written differently only by case ("So do I", "Greetings") is shown as written.
  const sameWord = shown.toLowerCase().replace(/’/g, "'") === wordKey;
  const headword = sameWord ? shown : wordKey;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="word-popover-title"
      tabIndex={-1}
      // Inline: the global :focus-visible ring would otherwise outline the whole card.
      style={{ visibility: "hidden", outline: "none" }}
      className="fixed top-0 left-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-paper px-4 pt-3 pb-3.5 text-left text-ink shadow-[0_12px_32px_-12px_rgb(43_36_32/0.45)] motion-safe:animate-[pop-in_120ms_ease-out]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-[0.68rem] text-muted">
            {introduced !== undefined ? (
              <span className="text-wine">Từ mới · trang {introduced}</span>
            ) : (
              "Nghĩa của từ"
            )}
          </p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span id="word-popover-title" lang="en" className="text-[1.5rem] leading-tight break-words text-wine">
              {headword}
            </span>
            {entry?.ipa && <span className="text-muted">{entry.ipa}</span>}
          </p>
          {!sameWord && (
            <p className="text-sm text-muted">
              Trong câu: <span lang="en" className="italic">“{shown}”</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-sm text-muted transition-colors hover:bg-card hover:text-ink"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>

      {entry ? (
        <>
          <p className="mt-2 text-[1.15rem] leading-snug">{entry.vi}</p>
          {entry.en && (
            <p lang="en" className="mt-1.5 leading-snug text-muted italic">
              {entry.en}
            </p>
          )}
          {introduced !== undefined && introduced < pageNumber && (
            <p className="mt-2.5 rounded-xl bg-wine/[0.06] px-3 py-2 text-sm text-ink/85 italic">
              Bạn đã gặp từ này ở trang {introduced}. Nhớ được không? 😊
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-muted italic">Chưa có giải thích cho từ này.</p>
      )}
    </div>,
    document.body,
  );
}
