"use client";

import { wordSegments } from "@/lib/dictionary";
import { segments } from "@/lib/vocab";
import { useWords } from "./WordContext";

type Props = { text: string };

const KEY_WORD = "underline decoration-dotted decoration-2 underline-offset-4";
/** Tapped word, while its meaning is open (set by WordPopover). */
const ACTIVE = "data-[active=true]:bg-current/15";

/**
 * Story text. Inside a WordProvider every known word can be tapped for its
 * meaning: story key words ([[marked]]) are underlined buttons; other words stay
 * plain so the line reads calmly, and respond to a tap.
 */
export default function StoryText({ text }: Props) {
  const words = useWords();

  if (!words) {
    return (
      <>
        {segments(text).map((s, i) =>
          s.kind === "text" ? (
            <span key={i}>{s.text}</span>
          ) : (
            <span key={i} className={`${KEY_WORD} decoration-current/50`}>
              {s.shown}
            </span>
          ),
        )}
      </>
    );
  }

  return (
    <>
      {wordSegments(text, words.lookup).map((s, i) => {
        if (s.kind === "text") return <span key={i}>{s.text}</span>;
        if (s.kind === "word") {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => words.openWord(s.shown, s.key, e.currentTarget)}
              aria-haspopup="dialog"
              className={`${KEY_WORD} ${ACTIVE} -mx-0.5 cursor-pointer rounded px-0.5 decoration-wine/60 hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-wine`}
            >
              {s.shown}
            </button>
          );
        }
        // Plain words: pointer only, so screen readers read the line as normal text.
        return (
          <span
            key={i}
            onClick={(e) => words.openWord(s.shown, s.key, e.currentTarget)}
            className={`${ACTIVE} -mx-px cursor-pointer rounded-sm px-px transition-colors hover:bg-current/10`}
          >
            {s.shown}
          </span>
        );
      })}
    </>
  );
}
