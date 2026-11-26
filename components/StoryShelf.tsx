"use client";

import Link from "next/link";
import { introHref, resumeHref } from "@/lib/links";
import type { StoryMeta } from "@/lib/schema";
import { endingFinished, resumePage, type Progress } from "@/lib/storage";
import TodayCard from "./TodayCard";
import { useProgress } from "./useProgress";

type Status = {
  /** Next page to open (`pages + 1` = The Last Page). */
  next: number;
  /** Chat pages finished. */
  done: number;
  /** "writing": every chat page read, the ending not finished yet. */
  state: "new" | "reading" | "writing" | "finished";
  href: string;
};

function statusOf(progress: Progress | null, story: StoryMeta): Status {
  const saved = progress?.stories[story.id] ?? { completedPages: [] };
  const next = resumePage(saved, story.pages);
  const done = saved.completedPages.filter((p) => p <= story.pages).length;
  const state =
    next > story.pages
      ? endingFinished(saved)
        ? "finished"
        : "writing"
      : done > 0 || saved.play
        ? "reading"
        : "new";
  // A story not started yet opens on its introduction, so the learner knows who they are in it.
  const href = state === "new" ? introHref(story.id) : resumeHref(story.id, next, story.pages);
  return { next, done, state, href };
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
      <TodayCard />

      <div className="mt-12 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl">Tủ truyện</h2>
        <p className="eyebrow text-muted">{stories.length} truyện</p>
      </div>
      <p className="mt-1 text-muted italic">Mỗi cặp một truyện Việt và một truyện phương Tây, cùng một đề tài.</p>

      {pairs.map((pair) => {
        const inPair = stories.filter((s) => s.pair === pair);
        return (
          <section key={pair} className="mt-8" aria-labelledby={`pair-${pair}`}>
            <h3 id={`pair-${pair}`} className="eyebrow text-wine">
              {inPair[0].themeVi}
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {inPair.map((story) => (
                <li key={story.id}>
                  <StoryRow story={story} status={statusOf(progress, story)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

const CONTINUE_COPY: Record<Status["state"], { eyebrow: string; button: (next: number) => string }> = {
  new: { eyebrow: "Bắt đầu từ đây", button: () => "Bắt đầu đọc" },
  reading: { eyebrow: "Đọc tiếp", button: (next) => `Đọc tiếp trang ${next}` },
  writing: { eyebrow: "Trang cuối đang chờ bạn", button: () => "Viết The Last Page" },
  finished: { eyebrow: "Bạn đã hoàn thành", button: () => "Xem đoạn kết của bạn" },
};

function ContinueCard({ story, status }: { story: StoryMeta; status: Status }) {
  const reading = status.state === "reading";
  const copy = CONTINUE_COPY[status.state];
  return (
    <section className="shadow-paper mt-8 rounded-3xl bg-ink px-6 py-6 text-paper" aria-labelledby="continue-title">
      <p className="eyebrow text-paper/65">{copy.eyebrow}</p>
      <h2 id="continue-title" className="mt-3 text-[1.9rem] leading-tight">
        {story.title}
      </h2>
      <p className="mt-1 text-paper/75 italic">{story.titleVi}</p>
      {reading ? (
        <div className="mt-4">
          <Bar done={status.done} total={story.pages} dark />
          <p className="mt-2 text-sm text-paper/70">
            Đã đọc {status.done}/{story.pages} trang
          </p>
        </div>
      ) : status.state === "writing" ? (
        <p className="mt-4 text-paper/75">Bạn đã đọc hết {story.pages} trang. Giờ hãy viết đoạn kết của riêng bạn.</p>
      ) : (
        <p className="mt-4 text-paper/75">
          {story.themeVi} · <span className="italic">{story.source}</span>
        </p>
      )}
      <Link href={status.href} className="btn-primary mt-5 w-full text-lg">
        {copy.button(status.next)} <span aria-hidden>→</span>
      </Link>
    </section>
  );
}

const STATUS_LABEL = (story: StoryMeta, status: Status): string =>
  ({
    new: "Chưa đọc",
    reading: `Đang đọc · trang ${status.next}/${story.pages}`,
    writing: "Chờ viết đoạn kết",
    finished: "Hoàn thành ✓",
  })[status.state];

/** One story as a row on the shelf, like a contents page. */
function StoryRow({ story, status }: { story: StoryMeta; status: Status }) {
  const active = status.state !== "new";
  return (
    <Link
      href={status.href}
      className="group block rounded-2xl border border-line bg-card px-4 py-3.5 transition-[border-color,box-shadow] hover:border-wine/40 hover:shadow-paper"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow text-muted">
          {story.origin === "vn" ? "Việt Nam" : "Phương Tây"} · {story.level}
        </p>
        <Fear level={story.fearLevel} />
      </div>
      <p className="mt-1.5 text-xl leading-snug group-hover:text-wine">{story.title}</p>
      <p className="text-muted italic">{story.titleVi}</p>
      <div className="mt-2 flex items-center gap-3">
        <p className={`text-sm ${active ? "font-bold text-wine" : "text-muted"}`}>{STATUS_LABEL(story, status)}</p>
        {status.state === "reading" && (
          <div className="w-24">
            <Bar done={status.done} total={story.pages} />
          </div>
        )}
      </div>
    </Link>
  );
}

/** How frightening a story is, out of 3. */
function Fear({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`Độ sợ ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`size-1.5 rounded-full ${i <= level ? "bg-wine" : "bg-line"}`} />
      ))}
    </span>
  );
}

function Bar({ done, total, dark }: { done: number; total: number; dark?: boolean }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i < done ? (dark ? "bg-paper" : "bg-wine") : dark ? "bg-paper/20" : "bg-line"}`}
        />
      ))}
    </div>
  );
}
