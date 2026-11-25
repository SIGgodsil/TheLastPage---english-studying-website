"use client";

import { segments } from "@/lib/vocab";
import { useWords } from "./WordContext";

type Props = { text: string };

const WORD_STYLE = "underline decoration-dotted decoration-2 underline-offset-4";

/**
 * Story text with its [[vocab]] marks underlined. Inside a WordProvider the
 * words are buttons that open the word sheet.
 */
export default function StoryText({ text }: Props) {
  const words = useWords();
  return (
    <>
      {segments(text).map((s, i) => {
        if (s.kind === "text") return <span key={i}>{s.text}</span>;
        if (!words) {
          return (
            <span key={i} className={`${WORD_STYLE} decoration-current/50`}>
              {s.shown}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => words.openWord(s.shown, s.key)}
            aria-haspopup="dialog"
            className={`${WORD_STYLE} -mx-0.5 cursor-pointer rounded px-0.5 decoration-wine/60 hover:bg-wine/10 focus-visible:outline-2 focus-visible:outline-wine`}
          >
            {s.shown}
          </button>
        );
      })}
    </>
  );
}
