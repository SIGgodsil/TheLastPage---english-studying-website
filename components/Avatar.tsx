type Props = { emoji?: string; name: string; size?: "sm" | "md" };

/** A round avatar showing a character's emoji, or their initial if they have none. */
export default function Avatar({ emoji, name, size = "md" }: Props) {
  const box = size === "sm" ? "size-8 text-base" : "size-10 text-xl";
  return (
    <span
      aria-hidden
      className={`shadow-paper flex shrink-0 items-center justify-center rounded-full border border-line bg-card ${box}`}
    >
      {emoji ?? <span className="text-base text-wine italic">{name.charAt(0)}</span>}
    </span>
  );
}
