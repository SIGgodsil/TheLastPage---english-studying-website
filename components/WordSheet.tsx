"use client";

import type { GlossaryEntry } from "@/lib/vocab";
import BottomSheet, { CloseButton } from "./BottomSheet";

type Props = {
  /** The word as it appears in the text, e.g. "knocked". Undefined when closed. */
  shown?: string;
  /** Its base form, e.g. "knock". */
  wordKey?: string;
  entry?: GlossaryEntry;
  pageNumber: number;
  onClose: () => void;
};

/** A bottom sheet explaining one word: base form, IPA, Vietnamese meaning and a simple English definition. */
export default function WordSheet({ shown, wordKey, entry, pageNumber, onClose }: Props) {
  return (
    <BottomSheet open={wordKey !== undefined} onClose={onClose} labelledBy="word-sheet-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-muted">Từ mới</p>
          <h2 id="word-sheet-title" lang="en" className="mt-1 text-[2.4rem] leading-none break-words text-wine">
            {wordKey}
          </h2>
          {entry && <p className="mt-2 text-lg text-muted">{entry.ipa}</p>}
          {shown && shown.toLowerCase() !== wordKey && (
            <p className="mt-1 text-muted">
              Trong câu: <span lang="en" className="italic">“{shown}”</span>
            </p>
          )}
        </div>
        <CloseButton onClose={onClose} />
      </div>

      {entry ? (
        <>
          <div className="shadow-paper mt-5 rounded-2xl border border-line bg-card px-5 py-4">
            <p className="eyebrow text-wine">Nghĩa</p>
            <p className="mt-1.5 text-xl">{entry.vi}</p>
            <div aria-hidden className="my-3.5 h-px bg-line" />
            <p className="eyebrow text-muted">Giải thích bằng tiếng Anh</p>
            <p lang="en" className="mt-1.5 text-lg leading-relaxed italic">
              {entry.en}
            </p>
          </div>
          {entry.page < pageNumber && (
            <p className="mt-4 rounded-2xl bg-wine/[0.06] px-4 py-3 text-ink/85 italic">
              Bạn đã gặp từ này ở trang {entry.page}. Nhớ được bao nhiêu rồi? 😊
            </p>
          )}
        </>
      ) : (
        <p className="mt-5 text-muted italic">Chưa có giải thích cho từ này.</p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="btn-ink mt-6 w-full"
      >
        Đã hiểu
      </button>
    </BottomSheet>
  );
}
