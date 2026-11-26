"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { LastPage } from "@/lib/schema";
import { EndingCard, type Mood } from "./EndingParts";
import ShareEnding from "./ShareEnding";

type Props = {
  storyId: string;
  storyTitle: string;
  mood?: Mood;
  text: string;
  modelEndings: LastPage["modelEndings"];
  onEdit: () => void;
};

const MODEL_LABEL: Record<LastPage["modelEndings"][number]["level"], string> = {
  A2: "Đoạn kết mẫu · A2",
  B1: "Đoạn kết mẫu · B1 (dài hơn)",
};

/** After "Hoàn thành": the learner's ending, sharing, and two model endings to compare. */
export default function EndingDone({ storyId, storyTitle, mood, text, modelEndings, onEdit }: Props) {
  const ending = useMemo(() => ({ storyId, mood, text }), [storyId, mood, text]);

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="eyebrow text-wine">Đã hoàn thành</p>
        <h2 className="mt-2 text-[1.9rem] leading-tight">Bạn đã viết xong The Last Page! 🎉</h2>
        <p className="mt-2 text-lg text-muted">
          Truyện <span className="italic">{storyTitle}</span> giờ có đoạn kết của riêng bạn.
        </p>
      </header>

      <EndingCard mood={mood} text={text} label="Đoạn kết của bạn" />

      <ShareEnding ending={ending} storyTitle={storyTitle} />

      <section aria-labelledby="models-title" className="flex flex-col gap-3">
        <h2 id="models-title" className="text-[1.35rem] leading-snug">
          So sánh với đoạn kết mẫu
        </h2>
        <p className="-mt-1 text-muted italic">
          Đây chỉ là hai cách kết khác. Đoạn kết của bạn không cần giống. Bạn có thể tìm một từ hay hoặc một mẫu câu để
          dùng lần sau.
        </p>
        {modelEndings.map((model) => (
          <details key={model.level} className="group rounded-2xl border border-line bg-card open:shadow-paper">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-lg transition-colors hover:text-wine [&::-webkit-details-marker]:hidden">
              {MODEL_LABEL[model.level]}
              <span className="text-muted transition-transform group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <p lang="en" className="border-t border-line px-5 pt-4 pb-5 text-lg leading-relaxed whitespace-pre-wrap">
              {model.text}
            </p>
          </details>
        ))}
      </section>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="btn-secondary w-full"
        >
          ✏️ Sửa lại đoạn kết
        </button>
        <Link
          href="/"
          className="py-2 text-center text-wine italic underline-offset-4 hover:underline"
        >
          Về tủ truyện, đọc truyện khác →
        </Link>
      </div>
    </div>
  );
}
