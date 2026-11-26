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
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold">Bạn đã viết xong The Last Page!</h2>
        <p className="mt-1 text-muted">
          Truyện <span className="font-serif italic">{storyTitle}</span> giờ có đoạn kết của riêng bạn.
        </p>
      </header>

      <EndingCard mood={mood} text={text} label="Đoạn kết của bạn" />

      <ShareEnding ending={ending} storyTitle={storyTitle} />

      <section aria-labelledby="models-title" className="flex flex-col gap-3">
        <h2 id="models-title" className="font-serif text-xl font-semibold">
          So sánh với đoạn kết mẫu
        </h2>
        <p className="text-sm text-muted">
          Đây chỉ là hai cách kết khác. Đoạn kết của bạn không cần giống. Bạn có thể tìm một từ hay hoặc một mẫu câu để
          dùng lần sau.
        </p>
        {modelEndings.map((model) => (
          <details key={model.level} className="group rounded-2xl border border-line bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {MODEL_LABEL[model.level]}
              <span className="text-muted transition group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <p lang="en" className="px-5 pb-5 font-serif text-lg leading-relaxed whitespace-pre-wrap">
              {model.text}
            </p>
          </details>
        ))}
      </section>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-line px-6 py-3 font-medium transition hover:border-wine/50 active:scale-[0.98]"
        >
          ✏️ Sửa lại đoạn kết
        </button>
        <Link
          href="/"
          className="rounded-full px-6 py-3 text-center font-medium text-wine underline-offset-4 hover:underline"
        >
          Về tủ truyện, đọc truyện khác →
        </Link>
      </div>
    </div>
  );
}
