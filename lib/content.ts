// Loads story content from `content/` and validates it with zod.
// Server-only (uses the file system). Plain async functions with no Next.js
// APIs, so routes add their own caching and scripts can import them as is.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  DictionarySchema,
  LastPageSchema,
  PageSchema,
  StoriesManifestSchema,
  type Dictionary,
  type LastPage,
  type Page,
  type StoryMeta,
} from "./schema.ts";

const CONTENT_DIR = path.join(process.cwd(), "content");
const SAFE_ID = /^[a-z][a-z0-9-]*$/;

/** What learners may see of the Last Page: the original ending stays with the writers. */
export type LastPageForLearner = Omit<LastPage, "authorNote">;

async function readJson<S extends z.ZodType>(schema: S, ...parts: string[]): Promise<z.output<S>> {
  const file = path.join(CONTENT_DIR, ...parts);
  const where = path.relative(process.cwd(), file);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${where}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid content in ${where}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** All stories, in map order. */
export async function loadStories(): Promise<StoryMeta[]> {
  const stories = await readJson(StoriesManifestSchema, "stories.json");
  return [...stories].sort((a, b) => a.order - b.order);
}

/** One story's manifest entry, or null if the id is unknown. */
export async function loadStory(storyId: string): Promise<StoryMeta | null> {
  if (!SAFE_ID.test(storyId)) return null;
  const stories = await loadStories();
  return stories.find((s) => s.id === storyId) ?? null;
}

/** One chat page, or null if the story or page number does not exist. */
export async function loadPage(storyId: string, pageNumber: number): Promise<Page | null> {
  const story = await loadStory(storyId);
  if (!story || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > story.pages) return null;
  const page = await readJson(PageSchema, storyId, `page-${pageNumber}.json`);
  if (page.storyId !== storyId || page.page !== pageNumber) {
    throw new Error(`content/${storyId}/page-${pageNumber}.json says it is ${page.storyId} page ${page.page}`);
  }
  return page;
}

/** Every chat page of a story, in order, or null if the story is unknown. */
export async function loadPages(storyId: string): Promise<Page[] | null> {
  const story = await loadStory(storyId);
  if (!story) return null;
  const numbers = Array.from({ length: story.pages }, (_, i) => i + 1);
  const pages = await Promise.all(numbers.map((n) => loadPage(storyId, n)));
  return pages.filter((p): p is Page => p !== null);
}

/** The tap-any-word dictionary shared by all stories. */
export async function loadDictionary(): Promise<Dictionary> {
  return readJson(DictionarySchema, "dictionary.json");
}

/** The Last Page for a story, without the writers-only `authorNote`, or null if unknown. */
export async function loadLastPage(storyId: string): Promise<LastPageForLearner | null> {
  const story = await loadStory(storyId);
  if (!story) return null;
  const lastPage = await readJson(LastPageSchema, storyId, "last-page.json");
  if (lastPage.storyId !== storyId) {
    throw new Error(`content/${storyId}/last-page.json says it is ${lastPage.storyId}`);
  }
  // Drop the original ending so it can never reach the browser.
  const { authorNote, ...forLearner } = lastPage;
  void authorNote;
  return forLearner;
}
