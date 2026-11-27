"use client";

import type { Page } from "@/lib/schema";
import SpeakButton from "./SpeakButton";

type Props = {
  vocab: Page["vocab"];
  pageNumber: number;
  /**
   * "stage": the screen before the chat starts, words always shown.
   * "review": above the chat, folded, for a second look.
   */
  variant: "stage" | "review";
};

/** "Từ cần biết": the page's key words, so the first messages hold fewer surprises. */
export default function KeyWordsCard({ vocab, pageNumber, variant }: Props) {
  const words = Object.entries(vocab);
  if (words.length === 0) return null;

  if (variant === "stage") {
    return (
      <section aria-labelledby="keywords-title" className="px-4 pt-6 pb-8">
        <p className="eyebrow text-wine">Trang {pageNumber} · Trước khi đọc</p>
        <h2 id="keywords-title" className="mt-2 text-[1.9rem] leading-tight">
          Từ cần biết
        </h2>
        <p className="mt-1.5 leading-snug text-muted italic">
          {words.length} từ mới sẽ gặp trong trang này. Đọc qua, bấm 🔊 để nghe, rồi bấm “Bắt đầu đọc”.
        </p>
        <div className="shadow-paper mt-5 rounded-3xl border border-line bg-card px-4 py-1">
          <WordList words={words} />
        </div>
        <p className="mt-4 text-sm text-muted italic">
          Trong truyện, các từ này có gạch chấm. Quên nghĩa thì cứ bấm vào từ.
        </p>
      </section>
    );
  }

  return (
    <details className="group mx-3 mt-4 rounded-2xl border border-line bg-card px-4 py-3 shadow-[0_1px_2px_rgb(43_36_32/0.05)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="eyebrow text-wine">Từ cần biết</span>
          <span className="ml-2 text-sm text-muted italic">Xem lại {words.length} từ</span>
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <div className="mt-1">
        <WordList words={words} />
      </div>
    </details>
  );
}

function WordList({ words }: { words: [string, Page["vocab"][string]][] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {words.map(([key, entry]) => (
        <li key={key} className="flex items-center gap-3 py-2.5">
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
  );
}
