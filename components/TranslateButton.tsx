type Props = { shown: boolean; onToggle: () => void };

/** Small "Dịch" toggle under a line that has a Vietnamese translation. */
export default function TranslateButton({ shown, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-muted hover:bg-line/60 hover:text-ink"
    >
      {shown ? "Ẩn bản dịch" : "Dịch"}
    </button>
  );
}
