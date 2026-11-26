// Daily streak and daily missions (docs/TASK-STREAK.md).
// The rules are pure functions of a stored state and a day key, so they can be
// tested without a browser. The storage helpers at the bottom keep the state in
// localStorage under its own key; every read and write is wrapped in try/catch.

import { z } from "zod";
import { isRecognitionSupported } from "./speech.ts";

// ---------- Days ----------

/** A local calendar day, "YYYY-MM-DD". */
export type DayKey = string;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar day of a moment (the phone's own date, not UTC). */
export function dayKey(date: Date = new Date()): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Noon on that day, so adding days never trips over a daylight-saving change. */
function parseDay(day: DayKey): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(day: DayKey, n: number): DayKey {
  const date = parseDay(day);
  date.setDate(date.getDate() + n);
  return dayKey(date);
}

/** The Monday of the day's week. */
export function weekStart(day: DayKey): DayKey {
  const weekday = (parseDay(day).getDay() + 6) % 7; // Monday = 0 … Sunday = 6
  return addDays(day, -weekday);
}

/** Monday … Sunday of the day's week. */
export function weekDays(day: DayKey): DayKey[] {
  const monday = weekStart(day);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ---------- Missions ----------

/** Things the app counts. */
export const ACTIVITIES = ["page", "word", "note", "listen", "shadow", "choice"] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const MISSION_IDS = ["read-page", "words", "notes", "listen", "shadow", "choices"] as const;
export type MissionId = (typeof MISSION_IDS)[number];

export type Mission = {
  id: MissionId;
  activity: Activity;
  target: number;
  /** Shown to the learner. */
  titleVi: string;
  /** Only offered where the browser can listen to the learner. */
  needsMic?: boolean;
};

export const MISSIONS: Record<MissionId, Mission> = {
  "read-page": { id: "read-page", activity: "page", target: 1, titleVi: "Đọc xong 1 trang" },
  words: { id: "words", activity: "word", target: 5, titleVi: "Tra nghĩa 5 từ" },
  notes: { id: "notes", activity: "note", target: 3, titleVi: "Xem 3 ghi chú “Cấu trúc”" },
  listen: { id: "listen", activity: "listen", target: 3, titleVi: "Nghe phát âm 3 từ" },
  shadow: { id: "shadow", activity: "shadow", target: 1, titleVi: "Luyện nói 1 câu", needsMic: true },
  choices: { id: "choices", activity: "choice", target: 2, titleVi: "Chọn 2 câu trả lời trong truyện" },
};

/** Every day starts with this one: it is also what makes a study day. */
export const MAIN_MISSION: MissionId = "read-page";
const POOL: MissionId[] = ["words", "notes", "listen", "shadow", "choices"];
/** Missions a day has: the main one plus this many from the pool. */
const EXTRA_MISSIONS = 2;

/** What the browser can do, which decides the missions on offer. */
export type DailyEnv = { canShadow: boolean };

/** A number from a string (FNV-1a), so a day always gets the same pick. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The pool in a fixed order for this day and salt. */
function shuffled(pool: MissionId[], seed: string): MissionId[] {
  return [...pool].sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`) || a.localeCompare(b));
}

function poolFor(env: DailyEnv): MissionId[] {
  return POOL.filter((id) => env.canShadow || !MISSIONS[id].needsMic);
}

/** The day's three missions: the same all day, new at midnight. */
export function pickMissions(day: DayKey, env: DailyEnv): MissionId[] {
  return [MAIN_MISSION, ...shuffled(poolFor(env), day).slice(0, EXTRA_MISSIONS)];
}

// ---------- State ----------

const Count = z.number().int().min(0);

const DaySchema = z.object({
  /** Fixed when the day's record is made, so they never change mid-day. */
  missions: z.array(z.enum(MISSION_IDS)).min(1),
  counts: z.partialRecord(z.enum(ACTIVITIES), Count),
  /** Set once the learner has swapped a mission today (one swap a day). */
  swapped: z.boolean().optional(),
});

const DailySchema = z.object({
  version: z.literal(1),
  days: z.record(z.string().regex(DAY_KEY), DaySchema),
  /** Longest streak ever, kept even after old days are pruned. */
  best: Count,
});

export type DayRecord = z.infer<typeof DaySchema>;
export type Daily = z.infer<typeof DailySchema>;

export const emptyDaily = (): Daily => ({ version: 1, days: {}, best: 0 });

/** Days kept in storage; older ones only matter for `best`, which is stored. */
const KEEP_DAYS = 60;

function dayRecord(state: Daily, day: DayKey, env: DailyEnv): DayRecord {
  return state.days[day] ?? { missions: pickMissions(day, env), counts: {} };
}

/** A study day: the learner finished at least one chat page. */
export function studied(state: Daily, day: DayKey): boolean {
  return (state.days[day]?.counts.page ?? 0) >= 1;
}

export type MissionProgress = Mission & { count: number; done: boolean };

/** The day's missions with how far the learner got. */
export function missionProgress(state: Daily, day: DayKey, env: DailyEnv): MissionProgress[] {
  const record = dayRecord(state, day, env);
  return record.missions.map((id) => {
    const mission = MISSIONS[id];
    const count = Math.min(record.counts[mission.activity] ?? 0, mission.target);
    return { ...mission, count, done: count >= mission.target };
  });
}

/** True when every mission of the day is done (a ⭐ day). */
export function allDone(state: Daily, day: DayKey, env: DailyEnv): boolean {
  return state.days[day] !== undefined && missionProgress(state, day, env).every((m) => m.done);
}

/** Drop days older than KEEP_DAYS before `today`. */
function prune(days: Daily["days"], today: DayKey): Daily["days"] {
  const oldest = addDays(today, -KEEP_DAYS);
  return Object.fromEntries(Object.entries(days).filter(([day]) => day >= oldest));
}

export type RecordResult = {
  state: Daily;
  /** Missions that this activity just finished (for a toast). */
  completed: Mission[];
  /** True when this activity finished the last open mission of the day. */
  allDoneNow: boolean;
};

/** Count one activity on `day`. */
export function recordActivity(state: Daily, day: DayKey, activity: Activity, env: DailyEnv): RecordResult {
  const before = missionProgress(state, day, env);
  const record = dayRecord(state, day, env);
  const nextRecord: DayRecord = {
    ...record,
    counts: { ...record.counts, [activity]: (record.counts[activity] ?? 0) + 1 },
  };
  let next: Daily = { ...state, days: prune({ ...state.days, [day]: nextRecord }, day) };
  next = { ...next, best: Math.max(next.best, streakInfo(next, day).current) };

  const after = missionProgress(next, day, env);
  const completed = after.filter((m, i) => m.done && !before[i].done);
  const allDoneNow = completed.length > 0 && after.every((m) => m.done);
  return { state: next, completed, allDoneNow };
}

/**
 * Swap one of today's missions for another from the pool. Allowed once a day,
 * never for the main mission, and only for a mission not done yet. Returns
 * null when the swap is not allowed.
 */
export function swapMission(state: Daily, day: DayKey, from: MissionId, env: DailyEnv): Daily | null {
  const record = dayRecord(state, day, env);
  if (record.swapped || from === MAIN_MISSION || !record.missions.includes(from)) return null;
  if (missionProgress(state, day, env).find((m) => m.id === from)?.done) return null;
  const to = shuffled(poolFor(env), `${day}:swap`).find((id) => !record.missions.includes(id));
  if (!to) return null;
  const missions = record.missions.map((id) => (id === from ? to : id));
  return { ...state, days: { ...state.days, [day]: { ...record, missions, swapped: true } } };
}

/** True when today's mission can still be swapped. */
export function canSwap(state: Daily, day: DayKey, id: MissionId, env: DailyEnv): boolean {
  return swapMission(state, day, id, env) !== null;
}

// ---------- Streak ----------

export type StreakInfo = {
  /** Study days in the current streak (rest days are not counted). */
  current: number;
  best: number;
  studiedToday: boolean;
  /** Missed days that the weekly rest day covered, inside the current streak. */
  restDays: DayKey[];
  /** The learner studied before, but the streak has ended: greet them kindly. */
  broken: boolean;
};

/**
 * The streak up to `today`. Today still counts as open: not having studied yet
 * today never ends a streak. Walking back from yesterday, each Monday–Sunday
 * week may skip one day without breaking the streak.
 */
export function streakInfo(state: Daily, today: DayKey): StreakInfo {
  const studiedToday = studied(state, today);
  const studyDays = Object.keys(state.days).filter((d) => d <= today && studied(state, d));
  const earliest = studyDays.reduce((a, b) => (a < b ? a : b), today);

  let current = studiedToday ? 1 : 0;
  const restDays: DayKey[] = [];
  const pendingRest: DayKey[] = [];
  const restWeeks = new Set<DayKey>();

  for (let day = addDays(today, -1); day >= earliest; day = addDays(day, -1)) {
    if (studied(state, day)) {
      current++;
      // Rest days only count once a study day sits before them in the chain.
      restDays.push(...pendingRest.splice(0));
      continue;
    }
    const week = weekStart(day);
    if (restWeeks.has(week)) break;
    restWeeks.add(week);
    pendingRest.push(day);
  }

  return {
    current,
    best: Math.max(state.best, current),
    studiedToday,
    restDays,
    broken: current === 0 && studyDays.length > 0,
  };
}

export type WeekDayStatus = "star" | "done" | "rest" | "today" | "missed" | "future";

/** Monday … Sunday of today's week, for the week strip. */
export function weekStrip(state: Daily, today: DayKey, env: DailyEnv): { day: DayKey; status: WeekDayStatus }[] {
  const { restDays } = streakInfo(state, today);
  return weekDays(today).map((day) => {
    let status: WeekDayStatus;
    if (day > today) status = "future";
    else if (allDone(state, day, env)) status = "star";
    else if (studied(state, day)) status = "done";
    else if (day === today) status = "today";
    else if (restDays.includes(day)) status = "rest";
    else status = "missed";
    return { day, status };
  });
}

// ---------- Storage (browser only) ----------

const STORAGE_KEY = "tlp:daily";
const CHANGE_EVENT = "tlp:daily-change";

/** The stored state as a string (cheap to compare for useSyncExternalStore), or null. */
export function readDailyRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Parse stored state; anything missing or invalid becomes an empty state. */
export function parseDaily(raw: string | null): Daily {
  if (!raw) return emptyDaily();
  try {
    const result = DailySchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : emptyDaily();
  } catch {
    return emptyDaily();
  }
}

export function readDaily(): Daily {
  return parseDaily(readDailyRaw());
}

function writeDaily(state: Daily): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent?.(new Event(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Call `onChange` when the daily state changes, in this tab or another. */
export function subscribeDaily(onChange: () => void): () => void {
  const fromOtherTab = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", fromOtherTab);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", fromOtherTab);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** This browser's abilities, for picking missions. */
export function browserEnv(): DailyEnv {
  return { canShadow: isRecognitionSupported() };
}

/** Listeners told when an activity finishes a mission (the chat shows a toast). */
type MissionListener = (result: Omit<RecordResult, "state">) => void;
const missionListeners = new Set<MissionListener>();

export function onMissionDone(listener: MissionListener): () => void {
  missionListeners.add(listener);
  return () => missionListeners.delete(listener);
}

/** Count one activity today and save it. Safe to call anywhere; never throws. */
export function track(activity: Activity): void {
  try {
    const { state, completed, allDoneNow } = recordActivity(readDaily(), dayKey(), activity, browserEnv());
    writeDaily(state);
    if (completed.length > 0) for (const listener of missionListeners) listener({ completed, allDoneNow });
  } catch {
    // Counting is a bonus: never let it break reading.
  }
}

/** Swap a mission today; false when not allowed or storage failed. */
export function swapToday(id: MissionId): boolean {
  const next = swapMission(readDaily(), dayKey(), id, browserEnv());
  return next !== null && writeDaily(next);
}
