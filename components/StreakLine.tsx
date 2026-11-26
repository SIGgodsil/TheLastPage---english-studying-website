"use client";

import { browserEnv, dayKey, missionProgress, streakInfo } from "@/lib/daily";
import { useDaily } from "./useDaily";

/** One line under a finished page: the streak and today's missions. */
export default function StreakLine() {
  const daily = useDaily();
  if (!daily) return null;
  const today = dayKey();
  const { current, studiedToday } = streakInfo(daily, today);
  if (!studiedToday) return null;
  const missions = missionProgress(daily, today, browserEnv());
  const left = missions.filter((m) => !m.done).length;

  return (
    <p className="rounded-2xl bg-wine/[0.07] px-4 py-2 leading-snug">
      <span aria-hidden>🔥 </span>
      {current === 1 ? "Ngày học đầu tiên của chuỗi!" : `${current} ngày học liên tiếp!`}
      <span className="block text-sm text-muted">
        {left === 0 ? "Bạn đã xong cả 3 nhiệm vụ hôm nay ⭐" : `Còn ${left} nhiệm vụ hôm nay`}
      </span>
    </p>
  );
}
