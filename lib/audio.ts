// Pre-made voice recordings for shadow lines (made offline with
// scripts/generate-audio.mjs). The manifest lists which files exist, so the
// app never requests a missing file.

import manifest from "./audio-manifest.json" with { type: "json" };

const KEYS = new Set<string>(manifest as string[]);

/** The mp3 for a shadow line, or null when there is none (the browser's voice is used instead). */
export function shadowAudio(storyId: string, page: number, nodeId: string): string | null {
  const key = `${storyId}/p${page}-${nodeId}`;
  return KEYS.has(key) ? `/audio/${key}.mp3` : null;
}

/** Credit required by the ElevenLabs free plan. */
export const AUDIO_CREDIT = { label: "ElevenLabs", href: "https://elevenlabs.io" } as const;
