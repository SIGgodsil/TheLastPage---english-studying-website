"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ENDING_TARGET, insertSnippet, usedWords, wordCount } from "@/lib/ending";
import type { LastPage } from "@/lib/schema";
import { finishEnding, saveEnding, storyProgress } from "@/lib/storage";
import EndingDone from "./EndingDone";
import EndingFeedback from "./EndingFeedback";
import { MoodPicker, StarterChips, WordBank, WordCounter, type Mood } from "./EndingParts";

type Props = {
  storyId: string;
  storyTitle: string;
  pattern: string;
  moods: LastPage["moods"];
  starters: string[];
  wordBank: LastPage["wordBank"];
  modelEndings: LastPage["modelEndings"];
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

function Writer({ storyId, storyTitle, pattern, moods, starters, wordBank, modelEndings, names }: Props) {
  const [initial] = useState(() => storyProgress(storyId).ending);
  const [mood, setMood] = useState<Mood | undefined>(initial?.mood);
  const [text, setText] = useState(initial?.text ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // A finished ending opens on the "done" view; "Sửa lại" goes back to writing.
  const [done, setDone] = useState(() => initial?.finished === true && wordCount(initial.text) > 0);
  const top = useRef<HTMLDivElement>(null);
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

  /** Show the start of the view the learner just switched to. */
  const switchView = (next: boolean) => {
    setDone(next);
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" }));
  };

  const finish = () => {
    dirty.current = false;
    setSaveState(finishEnding(storyId, { mood, text }) ? "saved" : "failed");
    switchView(true);
  };

  if (done) {
    return (
      <div ref={top} className="scroll-mt-4">
        <EndingDone
          storyId={storyId}
          storyTitle={storyTitle}
          mood={mood}
          text={text.trim()}
          modelEndings={modelEndings}
          onEdit={() => switchView(false)}
        />
        {saveState === "failed" && (
          <p className="mt-6 text-center text-sm text-muted italic" aria-live="polite">
            Trình duyệt này không cho lưu, nên đoạn kết sẽ mất khi bạn đóng trang. Bạn hãy chia sẻ hoặc chép lại nhé.
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={top} className="flex scroll-mt-4 flex-col gap-8">
      <section aria-labelledby="mood-title">
        <h2 id="mood-title" className="mb-3 text-[1.35rem] leading-snug">
          <span className="mr-2 text-wine italic">1.</span>
          Bạn muốn câu chuyện kết thúc thế nào?
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
        <h2 id="write-title" className="text-[1.35rem] leading-snug">
          <span className="mr-2 text-wine italic">2.</span>
          Viết đoạn kết của bạn
        </h2>
        <p className="-mt-1 text-muted italic">Bấm một câu gợi ý để bắt đầu, hoặc thử dùng mẫu câu ở trên.</p>
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
          className="shadow-paper w-full resize-y rounded-2xl border border-line bg-card px-4 py-3.5 text-lg leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 placeholder:italic focus:border-wine/50 focus:ring-4 focus:ring-wine/10"
        />
        <WordCounter count={count} />
      </section>

      <EndingFeedback text={text} pattern={pattern} bank={bankWords} knownWords={knownWords} onChange={replace} />

      <section aria-label="Từ của câu chuyện">
        <WordBank words={wordBank} used={used} onInsert={insert} />
      </section>

      <FinishButton count={count} onFinish={finish} />

      <p className="text-center text-sm text-muted italic" aria-live="polite">
        {saveState === "failed"
          ? "Trình duyệt này không cho lưu bản nháp. Bạn nhớ đừng đóng trang nhé."
          : saveState === "saved"
            ? "✓ Đã lưu bản nháp trên máy này"
            : "Bản nháp được tự động lưu trên máy này."}
      </p>
    </div>
  );
}

/** "Hoàn thành": open once there is something to keep; a short ending is fine, just said kindly. */
function FinishButton({ count, onFinish }: { count: number; onFinish: () => void }) {
  const ready = count >= ENDING_TARGET.least;
  return (
    <section aria-labelledby="finish-title" className="flex flex-col gap-2">
      <h2 id="finish-title" className="text-[1.35rem] leading-snug">
        <span className="mr-2 text-wine italic">3.</span>
        Hoàn thành
      </h2>
      <button
        type="button"
        onClick={onFinish}
        disabled={!ready}
        className="btn-primary w-full"
      >
        ✓ Hoàn thành đoạn kết
      </button>
      <p className="text-center text-muted italic">
        {!ready
          ? `Viết ít nhất ${ENDING_TARGET.least} từ để hoàn thành nhé.`
          : count < ENDING_TARGET.min
            ? "Đoạn kết còn hơi ngắn, nhưng bạn vẫn có thể hoàn thành và sửa lại sau."
            : "Đoạn kết sẽ được lưu, rồi bạn có thể chia sẻ và so sánh với đoạn kết mẫu."}
      </p>
    </section>
  );
}
