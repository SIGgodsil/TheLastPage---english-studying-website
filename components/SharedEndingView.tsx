"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { introHref } from "@/lib/links";
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
      <nav className="text-center">
        <Link href="/" translate="no" className="text-xl text-ink underline-offset-4 hover:text-wine">
          The Last Page
        </Link>
      </nav>

      {shared && story ? (
        <>
          <header className="text-center">
            <p className="eyebrow text-wine">Một đoạn kết mới</p>
            <p className="mt-3 text-muted italic">Một người bạn đã viết lại đoạn kết của</p>
            <h1 className="mt-1 text-[2.2rem] leading-tight">{story.title}</h1>
            <p className="text-lg text-muted italic">{story.titleVi}</p>
            <div aria-hidden className="mx-auto mt-4 flex w-32 items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="size-1.5 rounded-full bg-wine/70" />
              <span className="h-px flex-1 bg-line" />
            </div>
          </header>

          <EndingCard mood={shared.mood} text={shared.text} label="Đoạn kết được chia sẻ" />

          <section className="shadow-paper rounded-3xl bg-ink px-6 py-6 text-paper">
            <p className="leading-relaxed text-paper/80">
              Bạn muốn biết câu chuyện gốc? Đọc truyện bằng tin nhắn, chọn hướng đi cho nhân vật, rồi tự viết đoạn kết
              của riêng bạn. Miễn phí, không cần đăng ký.
            </p>
            <Link
              href={introHref(story.id)}
              className="btn-primary mt-5 w-full"
            >
              Đọc truyện này <span aria-hidden>→</span>
            </Link>
            <p className="mt-3 text-center text-sm text-paper/65 italic">
              {story.origin === "vn" ? "Truyện Việt Nam" : "Truyện phương Tây"} · Tiếng Anh {story.level}
            </p>
          </section>

          <Link href="/" className="py-1 text-center text-muted italic underline underline-offset-4 hover:text-wine">
            Xem tất cả truyện
          </Link>
        </>
      ) : (
        <section className="shadow-paper mt-6 rounded-3xl border border-line bg-card px-5 py-8 text-center">
          <p className="eyebrow text-wine">Liên kết bị hỏng</p>
          <h1 className="mt-3 text-[1.8rem] leading-tight">Liên kết này chưa mở được</h1>
          <p className="mt-3 leading-relaxed text-muted italic">
            Có thể liên kết bị thiếu một đoạn khi sao chép. Bạn hãy nhờ người gửi chép lại toàn bộ liên kết nhé.
          </p>
          <Link
            href="/"
            className="btn-primary mt-6 w-full px-4 whitespace-nowrap"
          >
            Khám phá The Last Page <span aria-hidden>→</span>
          </Link>
        </section>
      )}
    </div>
  );
}
