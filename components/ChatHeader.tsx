import Link from "next/link";
import type { Page } from "@/lib/schema";
import Avatar from "./Avatar";

type Props = { page: Page; totalPages: number };

/** Chat header: back link, who we are talking to, and where we are in the story. */
export default function ChatHeader({ page, totalPages }: Props) {
  const characters = Object.values(page.characters);
  const person = characters.find((c) => c.name === page.chatTitle);
  const emoji = person?.emoji ?? (characters.length > 1 ? "👥" : characters[0]?.emoji);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/95 px-3 py-2.5 backdrop-blur">
      <Link
        href="/"
        aria-label="Về trang chủ"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:bg-line/60"
      >
        ←
      </Link>
      <Avatar emoji={emoji} name={page.chatTitle} />
      <div className="min-w-0">
        <h1 className="truncate font-semibold leading-tight">{page.chatTitle}</h1>
        <p className="truncate text-xs text-muted">
          Trang {page.page}/{totalPages} · <span className="font-serif italic">{page.title}</span>
        </p>
      </div>
    </header>
  );
}
