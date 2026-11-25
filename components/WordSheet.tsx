"use client";

import { useEffect, useRef } from "react";
import type { GlossaryEntry } from "@/lib/vocab";

type Props = {
  /** The word as it appears in the text, e.g. "knocked". Undefined when closed. */
  shown?: string;
  /** Its base form, e.g. "knock". */
  wordKey?: string;
  entry?: GlossaryEntry;
  pageNumber: number;
  onClose: () => void;
};

/**
 * A bottom sheet explaining one word: base form, IPA, Vietnamese meaning and a
 * simple English definition. Uses <dialog> for focus handling, Esc and backdrop.
 */
export default function WordSheet({ shown, wordKey, entry, pageNumber, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = wordKey !== undefined;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dialog itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="word-sheet-title"
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto w-full max-w-xl rounded-t-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      {open && (
        <div className="px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
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
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:bg-line/60"
            >
              ✕
            </button>
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
        </div>
      )}
    </dialog>
  );
}
