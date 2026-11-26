"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { pageHref } from "@/lib/links";
import type { StoryMeta } from "@/lib/schema";
import { decodeShare } from "@/lib/share";
import { EndingCard } from "./EndingParts";

export type SharedStory = Pick<StoryMeta, "id" | "title" | "titleVi" | "origin" | "level">;

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** The shared ending from the URL fragment, as a card with a way into the story. */
export default function SharedEndingView({ stories }: { stories: SharedStory[] }) {
  // null on the server and during hydration: the fragment exists only in the browser.
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => null,
  );
  const shared = useMemo(() => (hash === null ? null : decodeShare(hash)), [hash]);
  const story = shared ? stories.find((s) => s.id === shared.storyId) : undefined;

  if (hash === null) return <div className="min-h-96" aria-busy />;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link href="/" className="font-serif font-semibold text-ink underline-offset-4 hover:underline">
          <span aria-hidden>📖 </span>The Last Page
        </Link>
      </nav>

      {shared && story ? (
        <>
          <header className="text-center">
            <p className="text-4xl" aria-hidden>
              ✍️
            </p>
            <p className="mt-3 text-muted">Một người bạn đã viết đoạn kết mới cho</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold">{story.title}</h1>
            <p className="font-serif text-muted italic">{story.titleVi}</p>
          </header>

          <EndingCard mood={shared.mood} text={shared.text} label="Đoạn kết được chia sẻ" />

          <section className="rounded-2xl bg-ink p-5 text-paper">
            <p className="leading-relaxed text-paper/80">
              Bạn muốn biết câu chuyện gốc? Đọc truyện bằng tin nhắn, chọn hướng đi cho nhân vật, rồi tự viết đoạn kết
              của riêng bạn. Miễn phí, không cần đăng ký.
            </p>
            <Link
              href={pageHref(story.id, 1)}
              className="mt-4 block w-full rounded-full bg-wine px-6 py-3 text-center font-medium text-paper transition active:scale-[0.98]"
            >
              Đọc truyện này →
            </Link>
            <p className="mt-2 text-center text-xs text-paper/60">
              {story.origin === "vn" ? "Truyện Việt Nam" : "Truyện phương Tây"} · Tiếng Anh {story.level}
            </p>
          </section>

          <Link href="/" className="text-center text-sm text-muted underline underline-offset-4 hover:text-wine">
            Xem tất cả truyện
          </Link>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-4xl" aria-hidden>
            🕯️
          </p>
          <h1 className="mt-3 font-serif text-2xl font-semibold">Liên kết này chưa mở được</h1>
          <p className="mt-2 leading-relaxed text-muted">
            Có thể liên kết bị thiếu một đoạn khi sao chép. Bạn hãy nhờ người gửi chép lại toàn bộ liên kết nhé.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
          >
            Khám phá The Last Page →
          </Link>
        </section>
      )}
    </div>
  );
}
