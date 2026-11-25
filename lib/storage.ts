// Learner progress in localStorage. Every read and write is wrapped in
// try/catch: storage can be missing, full or blocked (private mode).
// Bad or old data is ignored rather than trusted.

import { z } from "zod";
import type { PlayState } from "./engine.ts";

const STORAGE_KEY = "tlp:progress";
/** Fired on window after every save, so this tab's views can update too. */
const CHANGE_EVENT = "tlp:progress-change";

const PageNumber = z.number().int().min(1);

const SavedPlaySchema = z.object({
  page: PageNumber,
  path: z.array(z.string()).min(1),
  picks: z.record(z.string(), z.number().int().min(0)),
});

const StoryProgressSchema = z.object({
  /** Chat pages finished (cliffhanger reached). */
  completedPages: z.array(PageNumber),
  /** Where the learner is inside an unfinished page. */
  play: SavedPlaySchema.optional(),
  /** Best shadowing score (0–1) per line, keyed by `shadowKey(page, nodeId)`. */
  shadow: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

const ProgressSchema = z.object({
  version: z.literal(1),
  lastStoryId: z.string().optional(),
  stories: z.record(z.string(), StoryProgressSchema),
});

export type SavedPlay = z.infer<typeof SavedPlaySchema>;
export type StoryProgress = z.infer<typeof StoryProgressSchema>;
export type Progress = z.infer<typeof ProgressSchema>;

const emptyProgress = (): Progress => ({ version: 1, stories: {} });
const emptyStory = (): StoryProgress => ({ completedPages: [] });

/** The saved progress as stored (a string, so it is cheap to compare), or null. */
export function readProgressRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Parse stored progress; anything missing or invalid becomes empty progress. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  try {
    const result = ProgressSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** The saved progress, or empty progress if there is none or it cannot be read. */
export function readProgress(): Progress {
  return parseProgress(readProgressRaw());
}

/** Call `onChange` when progress changes, in this tab or another. Returns an unsubscribe function. */
export function subscribeProgress(onChange: () => void): () => void {
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

/** Save progress. Returns false if storage is unavailable; the app keeps working without it. */
export function writeProgress(progress: Progress): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent?.(new Event(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

function updateStory(storyId: string, change: (story: StoryProgress) => StoryProgress): boolean {
  const progress = readProgress();
  const story = progress.stories[storyId] ?? emptyStory();
  return writeProgress({
    ...progress,
    lastStoryId: storyId,
    stories: { ...progress.stories, [storyId]: change(story) },
  });
}

/** One story's progress (empty if never started). */
export function storyProgress(storyId: string): StoryProgress {
  return readProgress().stories[storyId] ?? emptyStory();
}

/** Remember where the learner is inside a page. */
export function savePlay(storyId: string, page: number, state: PlayState): boolean {
  return updateStory(storyId, (story) => ({ ...story, play: { page, path: state.path, picks: state.picks } }));
}

/** Mark a chat page as finished and forget the in-page position. */
export function completePage(storyId: string, page: number): boolean {
  return updateStory(storyId, ({ play, ...story }) => {
    void play;
    return { ...story, completedPages: [...new Set([...story.completedPages, page])].sort((a, b) => a - b) };
  });
}

/** Key for one shadow line in `StoryProgress.shadow`. */
export function shadowKey(page: number, nodeId: string): string {
  return `${page}/${nodeId}`;
}

/** Remember a shadowing attempt; only the best score per line is kept. */
export function saveShadow(storyId: string, page: number, nodeId: string, score: number): boolean {
  const key = shadowKey(page, nodeId);
  const clamped = Math.min(1, Math.max(0, score));
  return updateStory(storyId, (story) => ({
    ...story,
    shadow: { ...story.shadow, [key]: Math.max(story.shadow?.[key] ?? 0, clamped) },
  }));
}

/**
 * The page to open for a story: the unfinished page in progress, else the
 * first page not yet finished. `totalPages + 1` means "The Last Page".
 */
export function resumePage(story: StoryProgress, totalPages: number): number {
  if (story.play && story.play.page <= totalPages) return story.play.page;
  for (let page = 1; page <= totalPages; page++) {
    if (!story.completedPages.includes(page)) return page;
  }
  return totalPages + 1;
}
