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
    <header className="sticky top-0 z-10 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link
          href="/"
          aria-label="Về trang chủ"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl text-muted transition-colors hover:bg-card hover:text-ink"
        >
          <span aria-hidden>←</span>
        </Link>
        <Avatar emoji={emoji} name={page.chatTitle} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight">{page.chatTitle}</h1>
          <p className="truncate text-sm text-muted">
            <span className="eyebrow mr-1.5 text-wine">
              Trang {page.page}/{totalPages}
            </span>
            <span className="italic">{page.title}</span>
          </p>
        </div>
      </div>
      <div className="flex gap-1 px-3 pb-2" aria-hidden>
        {Array.from({ length: totalPages }, (_, i) => (
          <span key={i} className={`h-0.5 flex-1 rounded-full ${i < page.page ? "bg-wine/70" : "bg-line"}`} />
        ))}
      </div>
    </header>
  );
}
