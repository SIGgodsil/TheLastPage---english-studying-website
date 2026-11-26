"use client";

import Link from "next/link";
import { pageHref, resumeHref } from "@/lib/links";
import { resumePage } from "@/lib/storage";
import { useProgress } from "./useProgress";

type Props = { storyId: string; totalPages: number };

/** The intro's call to action: start at page 1, or carry on where the learner stopped. */
export default function IntroStart({ storyId, totalPages }: Props) {
  const progress = useProgress();
  const saved = progress?.stories[storyId];
  const next = saved ? resumePage(saved, totalPages) : 1;
  const started = saved !== undefined && (saved.completedPages.length > 0 || saved.play !== undefined);

  const label = !started
    ? "Bắt đầu đọc trang 1"
    : next > totalPages
      ? "Đến The Last Page"
      : `Đọc tiếp trang ${next}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <Link href={started ? resumeHref(storyId, next, totalPages) : pageHref(storyId, 1)} className="btn-primary w-full text-lg">
        {label} <span aria-hidden>→</span>
      </Link>
      {started && next > 1 && (
        <Link href={pageHref(storyId, 1)} className="py-1 text-muted italic underline-offset-4 hover:text-ink hover:underline">
          Đọc lại từ trang 1
        </Link>
      )}
    </div>
  );
}
