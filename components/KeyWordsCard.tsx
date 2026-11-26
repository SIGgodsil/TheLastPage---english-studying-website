"use client";

import type { Page } from "@/lib/schema";
import SpeakButton from "./SpeakButton";

type Props = {
  vocab: Page["vocab"];
  /** Open on a fresh page; folded once the learner has started reading it. */
  defaultOpen: boolean;
};

/**
 * "Từ cần biết": the page's key words before the chat starts, so the first
 * messages hold fewer surprises. A <details> element, so it folds away with
 * one tap and needs no saved state.
 */
export default function KeyWordsCard({ vocab, defaultOpen }: Props) {
  const words = Object.entries(vocab);
  if (words.length === 0) return null;

  return (
    <details
      open={defaultOpen}
      className="group mx-3 mt-4 rounded-2xl border border-line bg-card px-4 py-3 shadow-[0_1px_2px_rgb(43_36_32/0.05)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="eyebrow text-wine">Từ cần biết</span>
          <span className="ml-2 text-sm text-muted italic">{words.length} từ của trang này</span>
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <ul className="mt-3 flex flex-col divide-y divide-line">
        {words.map(([key, entry]) => (
          <li key={key} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span lang="en" className="text-lg text-wine">
                  {key}
                </span>
                <span className="text-sm text-muted">{entry.ipa}</span>
              </p>
              <p className="leading-snug">{entry.vi}</p>
            </div>
            <SpeakButton text={key} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted italic">Đọc qua một lượt rồi bấm “Tiếp” để bắt đầu. Gặp lại trong truyện, bấm vào từ để xem nghĩa.</p>
    </details>
  );
}
