import Avatar from "./Avatar";

type Props = { name: string; emoji?: string };

/** "Herbert đang nhập…" with three bouncing dots. */
export default function TypingIndicator({ name, emoji }: Props) {
  return (
    <div className="flex items-end gap-2" role="status">
      <div className="w-8 shrink-0">
        <Avatar emoji={emoji} name={name} size="sm" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-card px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        <span className="sr-only">{name} đang nhập…</span>
      </div>
    </div>
  );
}
