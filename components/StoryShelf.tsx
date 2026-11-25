"use client";

import Link from "next/link";
import { resumeHref } from "@/lib/links";
import type { StoryMeta } from "@/lib/schema";
import { resumePage, type Progress } from "@/lib/storage";
import { useProgress } from "./useProgress";

type Status = {
  /** Next page to open (`pages + 1` = The Last Page). */
  next: number;
  /** Chat pages finished. */
  done: number;
  state: "new" | "reading" | "finished";
  href: string;
};

function statusOf(progress: Progress | null, story: StoryMeta): Status {
  const saved = progress?.stories[story.id] ?? { completedPages: [] };
  const next = resumePage(saved, story.pages);
  const done = saved.completedPages.filter((p) => p <= story.pages).length;
  const state = next > story.pages ? "finished" : done > 0 || saved.play ? "reading" : "new";
  return { next, done, state, href: resumeHref(story.id, next, story.pages) };
}

/** The story to offer first: the last one read if unfinished, else the first unfinished one. */
function continueTarget(progress: Progress | null, stories: StoryMeta[]): StoryMeta {
  const last = stories.find((s) => s.id === progress?.lastStoryId);
  if (last && statusOf(progress, last).state !== "finished") return last;
  return stories.find((s) => statusOf(progress, s).state !== "finished") ?? stories[0];
}

type Props = { stories: StoryMeta[] };

/** Home: a "continue" card on top, then every story grouped by themed pair. */
export default function StoryShelf({ stories }: Props) {
  const progress = useProgress();
  const target = continueTarget(progress, stories);
  const pairs = [...new Set(stories.map((s) => s.pair))].sort((a, b) => a - b);

  return (
    <>
      <ContinueCard story={target} status={statusOf(progress, target)} />

      <h2 className="mt-10 font-serif text-2xl font-semibold">Tủ truyện</h2>
      <p className="mt-1 text-sm text-muted">
        {stories.length} truyện ma kinh điển, mỗi cặp một truyện Việt và một truyện phương Tây.
      </p>

      {pairs.map((pair) => {
        const inPair = stories.filter((s) => s.pair === pair);
        return (
          <section key={pair} className="mt-6" aria-labelledby={`pair-${pair}`}>
            <h3 id={`pair-${pair}`} className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              {inPair[0].themeVi}
            </h3>
            <ul className="flex flex-col gap-2">
              {inPair.map((story) => (
                <li key={story.id}>
                  <StoryCard story={story} status={statusOf(progress, story)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function ContinueCard({ story, status }: { story: StoryMeta; status: Status }) {
  const reading = status.state === "reading";
  return (
    <section className="rounded-3xl bg-ink p-5 text-paper shadow-lg">
      <p className="text-xs font-medium tracking-wide text-paper/70 uppercase">
        {reading ? "Đọc tiếp" : "Bắt đầu từ đây"}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-semibold">{story.title}</h2>
      <p className="font-serif text-paper/80 italic">{story.titleVi}</p>
      {reading ? (
        <div className="mt-4">
          <Bar done={status.done} total={story.pages} dark />
          <p className="mt-1.5 text-sm text-paper/70">
            Đã đọc {status.done}/{story.pages} trang
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-paper/70">
          {story.themeVi} · {story.source}
        </p>
      )}
      <Link
        href={status.href}
        className="mt-5 block w-full rounded-full bg-wine px-6 py-3 text-center font-medium text-paper transition active:scale-[0.98]"
      >
        {reading ? `Đọc tiếp trang ${status.next}` : "Bắt đầu đọc"} →
      </Link>
    </section>
  );
}

function StoryCard({ story, status }: { story: StoryMeta; status: Status }) {
  const label =
    status.state === "finished"
      ? "Đã đọc xong ✓"
      : status.state === "reading"
        ? `Đang đọc · trang ${status.next}/${story.pages}`
        : "Chưa đọc";

  return (
    <Link
      href={status.href}
      className="block rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-wine/50 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg leading-snug font-semibold">{story.title}</p>
          <p className="text-sm text-muted">{story.titleVi}</p>
        </div>
        <span className="shrink-0 text-sm" role="img" aria-label={`Độ sợ ${story.fearLevel}/3`}>
          {"🕯️".repeat(story.fearLevel)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          {story.origin === "vn" ? "Truyện Việt Nam" : "Truyện phương Tây"} · {story.level}
        </span>
        <span className={status.state === "new" ? undefined : "font-medium text-wine"}>{label}</span>
      </div>
      {status.state === "reading" && (
        <div className="mt-2">
          <Bar done={status.done} total={story.pages} />
        </div>
      )}
    </Link>
  );
}

function Bar({ done, total, dark }: { done: number; total: number; dark?: boolean }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < done ? "bg-wine" : dark ? "bg-paper/20" : "bg-line"}`}
        />
      ))}
    </div>
  );
}
