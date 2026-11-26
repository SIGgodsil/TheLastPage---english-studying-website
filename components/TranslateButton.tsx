import { track } from "@/lib/daily";

type Props = {
  shown: boolean;
  onToggle: () => void;
  /** Button text while closed and while open. Defaults to the translation toggle. */
  label?: string;
  hideLabel?: string;
};

/** Small toggle under a line: "Dịch" for its translation, "Cấu trúc" for its pattern note. */
export default function TranslateButton({ shown, onToggle, label = "Dịch", hideLabel = "Ẩn bản dịch" }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      className="inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-[0.8rem] text-muted italic transition-colors hover:bg-card hover:text-wine aria-pressed:text-wine"
    >
      {shown ? hideLabel : label}
    </button>
  );
}

/** The "Cấu trúc" toggle. */
export function NoteButton({ shown, onToggle }: Pick<Props, "shown" | "onToggle">) {
  // Opening a note counts towards the "Xem 3 ghi chú" mission; closing it does not.
  const toggle = () => {
    if (!shown) track("note");
    onToggle();
  };
  return <TranslateButton shown={shown} onToggle={toggle} label="Cấu trúc" hideLabel="Ẩn cấu trúc" />;
}
