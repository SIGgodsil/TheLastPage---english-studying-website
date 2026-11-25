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
        <div>
          <h2 id="word-sheet-title" className="font-serif text-3xl font-semibold text-wine">
            {wordKey}
          </h2>
          {entry && <p className="mt-1 text-muted">{entry.ipa}</p>}
          {shown && shown.toLowerCase() !== wordKey && (
            <p className="mt-1 text-sm text-muted">
              Trong câu: <span className="italic">“{shown}”</span>
            </p>
          )}
        </div>
        <CloseButton onClose={onClose} />
      </div>

      {entry ? (
        <>
          <p className="mt-5 text-lg font-medium">{entry.vi}</p>
          <p className="mt-3 text-xs font-medium tracking-wide text-muted uppercase">Giải thích bằng tiếng Anh</p>
          <p className="mt-1 font-serif text-lg italic">{entry.en}</p>
          {entry.page < pageNumber && (
            <p className="mt-5 rounded-xl bg-card px-4 py-3 text-sm text-muted">
              Bạn đã gặp từ này ở trang {entry.page}. Nhớ được bao nhiêu rồi? 😊
            </p>
          )}
        </>
      ) : (
        <p className="mt-5 text-muted">Chưa có giải thích cho từ này.</p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-full bg-ink px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
      >
        Đã hiểu
      </button>
    </BottomSheet>
  );
}
