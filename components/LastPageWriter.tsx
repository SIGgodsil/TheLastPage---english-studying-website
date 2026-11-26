"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { insertSnippet, usedWords, wordCount } from "@/lib/ending";
import type { LastPage } from "@/lib/schema";
import { saveEnding, storyProgress } from "@/lib/storage";
import EndingFeedback from "./EndingFeedback";
import { MoodPicker, StarterChips, WordBank, WordCounter, type Mood } from "./EndingParts";

type Props = {
  storyId: string;
  pattern: string;
  moods: LastPage["moods"];
  starters: string[];
  wordBank: LastPage["wordBank"];
  /** Character names from the story, so they are not flagged as spelling mistakes. */
  names: string[];
};

const noSubscribe = () => () => {};
const SAVE_DELAY_MS = 400;

/**
 * The writing area of The Last Page. Renders only in the browser, because the
 * draft lives in localStorage.
 */
export default function LastPageWriter(props: Props) {
  const isClient = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!isClient) return <div className="min-h-96" aria-busy />;
  return <Writer key={props.storyId} {...props} />;
}

type SaveState = "idle" | "saved" | "failed";

function Writer({ storyId, pattern, moods, starters, wordBank, names }: Props) {
  const [initial] = useState(() => storyProgress(storyId).ending);
  const [mood, setMood] = useState<Mood | undefined>(initial?.mood);
  const [text, setText] = useState(initial?.text ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const box = useRef<HTMLTextAreaElement>(null);
  const touched = useRef(false); // has the learner placed the cursor yet?
  const pendingCursor = useRef<number | null>(null);

  const count = wordCount(text);
  const bankWords = useMemo(() => wordBank.map((w) => w.word), [wordBank]);
  const used = useMemo(() => usedWords(text, bankWords), [text, bankWords]);
  const knownWords = useMemo(() => [...names, ...bankWords], [names, bankWords]);

  // Save the draft shortly after the learner stops typing, and when leaving.
  const latest = useRef({ mood, text });
  useEffect(() => {
    latest.current = { mood, text };
  }, [mood, text]);
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      setSaveState(saveEnding(storyId, { mood, text }) ? "saved" : "failed");
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [storyId, mood, text]);
  useEffect(() => {
    const flush = () => {
      if (dirty.current) saveEnding(storyId, latest.current);
      dirty.current = false;
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [storyId]);

  // Put the cursor where an insertion asked for it, after React has rendered the new text.
  useEffect(() => {
    const cursor = pendingCursor.current;
    if (cursor === null || !box.current) return;
    pendingCursor.current = null;
    box.current.focus();
    box.current.setSelectionRange(cursor, cursor);
  }, [text]);

  const edit = (next: string) => {
    dirty.current = true;
    setSaveState("idle");
    setText(next);
  };

  /** Replace the whole text (a feedback fix); a cursor focuses the box there. */
  const replace = (next: string, cursor?: number) => {
    if (cursor !== undefined) {
      pendingCursor.current = cursor;
      touched.current = true;
    }
    edit(next);
  };

  const insert = (snippet: string) => {
    const el = box.current;
    const start = el && touched.current ? el.selectionStart : text.length;
    const end = el && touched.current ? el.selectionEnd : text.length;
    const result = insertSnippet(text, start, end, snippet);
    pendingCursor.current = result.cursor;
    touched.current = true;
    edit(result.text);
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="mood-title">
        <h2 id="mood-title" className="mb-3 font-serif text-xl font-semibold">
          1. Bạn muốn câu chuyện kết thúc thế nào?
        </h2>
        <MoodPicker
          moods={moods}
          value={mood}
          onChange={(next) => {
            dirty.current = true;
            setSaveState("idle");
            setMood(next);
          }}
        />
      </section>

      <section aria-labelledby="write-title" className="flex flex-col gap-3">
        <h2 id="write-title" className="font-serif text-xl font-semibold">
          2. Viết đoạn kết của bạn
        </h2>
        <p className="text-sm text-muted">Bấm một câu gợi ý để bắt đầu, hoặc thử dùng mẫu câu ở trên.</p>
        <StarterChips starters={starters} onPick={insert} />
        <label htmlFor="ending-text" className="sr-only">
          Đoạn kết của bạn (bằng tiếng Anh)
        </label>
        <textarea
          id="ending-text"
          ref={box}
          lang="en"
          value={text}
          onChange={(e) => edit(e.target.value)}
          onFocus={() => (touched.current = true)}
          rows={9}
          maxLength={5000}
          spellCheck={false}
          autoCapitalize="sentences"
          placeholder={pattern}
          className="w-full resize-y rounded-2xl border border-line bg-card px-4 py-3 font-serif text-lg leading-relaxed outline-none placeholder:text-muted/60 placeholder:italic focus:border-wine/60"
        />
        <WordCounter count={count} />
      </section>

      <EndingFeedback text={text} pattern={pattern} bank={bankWords} knownWords={knownWords} onChange={replace} />

      <section aria-label="Từ của câu chuyện">
        <WordBank words={wordBank} used={used} onInsert={insert} />
      </section>

      <p className="text-center text-xs text-muted" aria-live="polite">
        {saveState === "failed"
          ? "Trình duyệt này không cho lưu bản nháp. Bạn nhớ đừng đóng trang nhé."
          : saveState === "saved"
            ? "✓ Đã lưu bản nháp trên máy này"
            : "Bản nháp được tự động lưu trên máy này."}
      </p>
    </div>
  );
}
