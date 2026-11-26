type Props = { note: string; className?: string };

/**
 * A pattern note: Vietnamese, with English fragments written between
 * asterisks (*So do I!*) shown in italics.
 */
export default function PatternNote({ note, className = "" }: Props) {
  const parts = note.split(/\*([^*]+)\*/);
  return (
    <p className={`text-[0.95rem] leading-relaxed text-ink/85 ${className}`}>
      <span className="eyebrow mr-1 text-[0.65rem] text-wine">Cấu trúc</span>{" "}
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <i key={i} lang="en" className="text-wine-deep">
            {part}
          </i>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
