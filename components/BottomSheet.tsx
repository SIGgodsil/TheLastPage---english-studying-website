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
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[90dvh] w-full max-w-xl overscroll-contain overflow-y-auto rounded-t-[2rem] bg-paper p-0 text-left text-ink shadow-[0_-16px_48px_-16px_rgb(43_36_32/0.4)] backdrop:bg-ink/35 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-line" aria-hidden />
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
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-card text-base text-muted transition-colors hover:border-ink/30 hover:text-ink"
    >
      <span aria-hidden>✕</span>
    </button>
  );
}
