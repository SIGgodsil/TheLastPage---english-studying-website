"use client";

import {
  allDone,
  browserEnv,
  canSwap,
  dayKey,
  missionProgress,
  streakInfo,
  swapToday,
  weekStrip,
  type StreakInfo,
  type WeekDayStatus,
} from "@/lib/daily";
import { useDaily } from "./useDaily";

const WEEKDAY = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** One kind line about the streak: never a warning. */
function streakMessage(info: StreakInfo): string {
  if (info.studiedToday) return "Hôm nay bạn đã giữ chuỗi. Hẹn gặp lại ngày mai!";
  if (info.current > 0) return "Đọc xong 1 trang hôm nay để giữ chuỗi nhé.";
  if (info.broken) return "Chào mừng bạn quay lại! Đọc xong 1 trang để bắt đầu chuỗi mới.";
  return "Đọc xong 1 trang mỗi ngày để bắt đầu chuỗi ngày học.";
}

/** Home: today's streak, the week and the three missions. */
export default function TodayCard() {
  const daily = useDaily();
  // Server render and hydration: keep the space so the page does not jump.
  if (!daily) return <div className="mt-6 min-h-[22rem] rounded-3xl border border-line bg-card" aria-hidden />;

  const today = dayKey();
  const env = browserEnv();
  const info = streakInfo(daily, today);
  const missions = missionProgress(daily, today, env);
  const doneCount = missions.filter((m) => m.done).length;
  const perfect = allDone(daily, today, env);
  const swappable = missions.filter((m) => canSwap(daily, today, m.id, env)).map((m) => m.id);

  return (
    <section
      aria-labelledby="today-title"
      className="shadow-paper mt-6 rounded-3xl border border-line bg-card px-5 py-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="today-title" className="eyebrow text-wine">
          Hôm nay
        </h2>
        {info.best > 0 && <p className="text-sm text-muted italic">Kỷ lục: {info.best} ngày</p>}
      </div>

      <p className="mt-2 flex items-baseline gap-2">
        <span aria-hidden className="text-2xl">🔥</span>
        <span className="text-[2.2rem] leading-none">{info.current}</span>
        <span className="text-lg">ngày học liên tiếp</span>
      </p>
      <p className="mt-1.5 leading-snug text-ink/80 italic">{streakMessage(info)}</p>

      <WeekStrip days={weekStrip(daily, today, env)} />
      <p className="mt-2 text-center text-xs text-muted">Mỗi tuần được nghỉ 1 ngày mà chuỗi không mất.</p>

      <div aria-hidden className="my-4 h-px bg-line" />

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg">Nhiệm vụ hôm nay</h3>
        <p className="text-sm text-muted">
          {doneCount}/{missions.length}
        </p>
      </div>
      {perfect ? (
        <p className="mt-1 text-wine italic">⭐ Bạn đã xong cả 3 nhiệm vụ hôm nay. Tuyệt vời!</p>
      ) : (
        swappable.length > 0 && (
          <p className="mt-1 text-sm text-muted italic">Nhiệm vụ nào khó làm, bạn được đổi 1 lần mỗi ngày.</p>
        )
      )}
      <ul className="mt-2 flex flex-col gap-2">
        {missions.map((m) => (
          <li
            key={m.id}
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 ${
              m.done ? "border-wine/25 bg-wine/[0.05]" : "border-line bg-paper/60"
            }`}
          >
            <span
              aria-hidden
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${
                m.done ? "bg-wine text-paper" : "border border-line"
              }`}
            >
              {m.done ? "✓" : ""}
            </span>
            <span className={`flex-1 leading-snug ${m.done ? "text-muted line-through decoration-wine/40" : ""}`}>
              {m.titleVi}
            </span>
            <span className="text-sm text-muted tabular-nums">
              <span className="sr-only">{m.done ? "Đã xong" : "Tiến độ"} </span>
              {m.count}/{m.target}
            </span>
            {swappable.includes(m.id) && (
              <button
                type="button"
                onClick={() => swapToday(m.id)}
                aria-label={`Đổi nhiệm vụ “${m.titleVi}” sang nhiệm vụ khác`}
                className="-my-1 -mr-1.5 min-h-8 shrink-0 rounded-full px-2.5 text-sm text-wine italic transition-colors hover:bg-wine/10"
              >
                Đổi
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const STATUS_LABEL: Record<WeekDayStatus, string> = {
  star: "xong cả 3 nhiệm vụ",
  done: "đã học",
  rest: "ngày nghỉ",
  today: "hôm nay",
  missed: "không học",
  before: "chưa bắt đầu",
  future: "chưa tới",
};

const STATUS_STYLE: Record<WeekDayStatus, string> = {
  star: "border border-wine/50 bg-wine/10",
  done: "bg-wine text-paper",
  rest: "border border-dashed border-muted/60 text-[0.65rem] text-muted italic",
  today: "border-2 border-wine/60 text-wine",
  missed: "bg-line/50",
  before: "border border-line/70",
  future: "border border-line/70",
};

function WeekStrip({ days }: { days: { day: string; status: WeekDayStatus }[] }) {
  return (
    <ol className="mt-4 grid grid-cols-7 gap-1 text-center" aria-label="Tuần này">
      {days.map(({ day, status }, i) => (
        <li key={day} className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted">{WEEKDAY[i]}</span>
          <span
            aria-label={`${WEEKDAY[i]}: ${STATUS_LABEL[status]}`}
            role="img"
            className={`flex size-8 items-center justify-center rounded-full text-sm ${STATUS_STYLE[status]}`}
          >
            {status === "star" ? "⭐" : status === "done" ? "✓" : status === "rest" ? "nghỉ" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
