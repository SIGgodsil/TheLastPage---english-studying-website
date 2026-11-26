type Props = { shown: boolean; onToggle: () => void };

/** Small "Dịch" toggle under a line that has a Vietnamese translation. */
export default function TranslateButton({ shown, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      className="inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-[0.8rem] text-muted italic transition-colors hover:bg-card hover:text-wine aria-pressed:text-wine"
    >
      {shown ? "Ẩn bản dịch" : "Dịch"}
    </button>
  );
}
