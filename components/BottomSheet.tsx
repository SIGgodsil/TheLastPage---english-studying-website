"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Id of the element that names the sheet (its heading). */
  labelledBy: string;
  children: ReactNode;
};

/**
 * A sheet that slides up from the bottom of the screen. Built on <dialog>,
 * which gives focus handling, Esc to close and a backdrop for free.
 * Children render only while open.
 */
export default function BottomSheet({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

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
      aria-labelledby={labelledBy}
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      {open && (
        <div className="px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
          {children}
        </div>
      )}
    </dialog>
  );
}

/** The round ✕ button for a sheet's top-right corner. */
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng"
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:bg-line/60"
    >
      ✕
    </button>
  );
}
