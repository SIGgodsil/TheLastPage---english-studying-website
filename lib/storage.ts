// Learner progress in localStorage. Every read and write is wrapped in
// try/catch: storage can be missing, full or blocked (private mode).
// Bad or old data is ignored rather than trusted.

import { z } from "zod";
import type { PlayState } from "./engine.ts";

const STORAGE_KEY = "tlp:progress";

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

/** The saved progress, or empty progress if there is none or it cannot be read. */
export function readProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const result = ProgressSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** Save progress. Returns false if storage is unavailable; the app keeps working without it. */
export function writeProgress(progress: Progress): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
  return updateStory(storyId, (story) => ({
    completedPages: [...new Set([...story.completedPages, page])].sort((a, b) => a - b),
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
