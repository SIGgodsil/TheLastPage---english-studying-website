"use client";

import { useMemo, useState } from "react";
import { shareUrl, type SharedEnding } from "@/lib/share";

type Props = {
  ending: SharedEnding;
  storyTitle: string;
};

type CopyState = "idle" | "copied" | "manual";

/**
 * Share the ending by link: the phone's share sheet where there is one
 * (Web Share API), and "Sao chép liên kết" everywhere. Renders in the browser
 * only (it needs the page's origin).
 */
export default function ShareEnding({ ending, storyTitle }: Props) {
  const url = useMemo(() => shareUrl(window.location.origin, ending), [ending]);
  const canShare = typeof navigator.share === "function";
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("manual"); // no clipboard access: show the link to copy by hand
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: `Đoạn kết mới cho ${storyTitle}`,
        text: `Mình vừa viết lại đoạn kết của truyện ${storyTitle} bằng tiếng Anh. Đọc thử nhé!`,
        url,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // closed the share sheet
      await copy();
    }
  };

  return (
    <section aria-labelledby="share-title" className="shadow-paper rounded-3xl border border-line bg-card px-5 py-5">
      <h2 id="share-title" className="text-[1.35rem] leading-snug">
        Chia sẻ đoạn kết
      </h2>
      <p className="mt-1 text-muted italic">
        Đoạn kết nằm ngay trong liên kết, không được lưu trên máy chủ nào. Ai có liên kết cũng đọc được.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="btn-primary w-full"
          >
            Chia sẻ
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={
            canShare
              ? "btn-secondary w-full"
              : "btn-primary w-full"
          }
        >
          {copyState === "copied" ? "✓ Đã sao chép liên kết" : "Sao chép liên kết"}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {copyState === "copied" ? "Đã sao chép liên kết" : ""}
      </p>

      {copyState === "manual" && (
        <div className="mt-3">
          <label htmlFor="share-link" className="text-sm text-muted">
            Trình duyệt chưa cho sao chép tự động. Bạn hãy chọn và sao chép liên kết này:
          </label>
          <input
            id="share-link"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            autoFocus
            className="mt-1.5 w-full rounded-full border border-line bg-paper px-4 py-2 text-sm"
          />
        </div>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener"
        className="mt-3 inline-block text-muted italic underline underline-offset-4 hover:text-wine"
      >
        Xem trước trang chia sẻ ↗
      </a>
    </section>
  );
}
