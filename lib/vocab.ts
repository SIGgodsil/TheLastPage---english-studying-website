// Vocabulary lookup and text segmentation for tap-to-understand.

import type { z } from "zod";
import { VOCAB_MARK, type Page, type VocabEntrySchema } from "./schema.ts";

export type VocabEntry = z.infer<typeof VocabEntrySchema>;

/** A vocab entry plus the page where the word was first introduced. */
export type GlossaryEntry = VocabEntry & { page: number };

/** Every word defined so far, keyed by base form. A plain object so it can be passed to client components. */
export type Glossary = Record<string, GlossaryEntry>;

/**
 * All words introduced on pages 1…`upToPage` (all pages if omitted).
 * A word keeps the definition from the page that first introduced it.
 */
export function buildGlossary(pages: Page[], upToPage = Infinity): Glossary {
  const glossary: Glossary = {};
  const ordered = [...pages].sort((a, b) => a.page - b.page);
  for (const page of ordered) {
    if (page.page > upToPage) break;
    for (const [key, entry] of Object.entries(page.vocab)) {
      if (!(key in glossary)) glossary[key] = { ...entry, page: page.page };
    }
  }
  return glossary;
}

export type Segment = { kind: "text"; text: string } | { kind: "word"; shown: string; key: string };

/** Split story text into plain runs and tappable vocab words. */
export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(VOCAB_MARK)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ kind: "text", text: text.slice(last, start) });
    out.push({ kind: "word", shown: m[1], key: (m[2] ?? m[1]).trim().toLowerCase() });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}
