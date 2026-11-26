// Share an ending by link, with no server storage: the story id, mood and
// text are compressed with lz-string into the URL fragment (#…), which the
// browser never sends to the server.

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import { MOODS } from "./schema.ts";

export const SHARE_PATH = "/shared";
/** Same limit as a saved ending. */
export const SHARE_MAX_CHARS = 5000;
/** A longer fragment is not one of ours; it is not decompressed at all. */
const MAX_FRAGMENT_CHARS = 20000;

const SharedSchema = z.object({
  v: z.literal(1),
  s: z.string().regex(/^[a-z0-9-]{1,60}$/),
  m: z.enum(MOODS).optional(),
  t: z.string().trim().min(1).max(SHARE_MAX_CHARS),
});

export type SharedEnding = {
  storyId: string;
  mood?: (typeof MOODS)[number];
  text: string;
};

/** The fragment (without "#") that carries an ending. */
export function encodeShare(ending: SharedEnding): string {
  const data: z.input<typeof SharedSchema> = {
    v: 1,
    s: ending.storyId,
    ...(ending.mood ? { m: ending.mood } : {}),
    t: ending.text.trim().slice(0, SHARE_MAX_CHARS),
  };
  return compressToEncodedURIComponent(JSON.stringify(data));
}

/** The ending in a fragment (with or without "#"), or null if it is missing, damaged or not ours. */
export function decodeShare(fragment: string): SharedEnding | null {
  const packed = fragment.replace(/^#/, "");
  if (!packed || packed.length > MAX_FRAGMENT_CHARS) return null;
  try {
    const json = decompressFromEncodedURIComponent(packed);
    if (!json) return null;
    const result = SharedSchema.safeParse(JSON.parse(json));
    if (!result.success) return null;
    const { s, m, t } = result.data;
    return { storyId: s, ...(m ? { mood: m } : {}), text: t };
  } catch {
    return null;
  }
}

/** The full link to share, e.g. https://example.app/shared#N4Ig… */
export function shareUrl(origin: string, ending: SharedEnding): string {
  return `${origin}${SHARE_PATH}#${encodeShare(ending)}`;
}
