"use client";

import { useState } from "react";
import { ENDING_TARGET, insertSnippet } from "@/lib/ending";
import {
  applyFix,
  fetchLanguageCheck,
  languageToolFixes,
  localFixes,
  locate,
  mergeFixes,
  shiftFixes,
  strengths,
  type Fix,
  type Strengths,
} from "@/lib/feedback";
import { CHECK_NOTE, fixMessage, noteMessage, OFFLINE_NOTE, praiseLines, type NoteKind } from "./endingCopy";

type Props = {
  text: string;
  pattern: string;
  /** The story's word bank. */
  bank: string[];
  /** Character names and story words: never flagged as spelling mistakes. */
  knownWords: string[];
  /** Replace the text; `cursor` focuses the box there. */
  onChange: (text: string, cursor?: number) => void;
};

/** Fewer suggestions at once keeps feedback encouraging; checking again shows the rest. */
const MAX_FIXES = 6;
/** Below this, there is not enough to give feedback on. */
const MIN_WORDS = 8;

type Review =
  | { status: "idle" }
  | { status: "checking" }
  | {
      status: "ready";
      /** The text as checked, or as changed by accepting a suggestion. */
      checked: string;
      strengths: Strengths;
      fixes: Fix[];
      notes: NoteKind[];
      /** How many suggestions (fixes, then notes) the learner has gone through. */
      index: number;
      offline: boolean;
    };

/** "Nhận xét": praise first, then one suggestion at a time. */
export default function EndingFeedback({ text, pattern, bank, knownWords, onChange }: Props) {
  const [review, setReview] = useState<Review>({ status: "idle" });
  const s = strengths(text, bank, pattern);

  const check = async () => {
    const snapshot = text;
    setReview({ status: "checking" });
    const matches = await fetchLanguageCheck(snapshot);
    const fixes = mergeFixes(localFixes(snapshot), matches ? languageToolFixes(snapshot, matches, knownWords) : []);
    const found = strengths(snapshot, bank, pattern);
    const notes: NoteKind[] = [];
    if (found.count < ENDING_TARGET.min) notes.push("length");
    if (found.used.length === 0) notes.push("words");
    if (!found.pattern) notes.push("pattern");
    setReview({
      status: "ready",
      checked: snapshot,
      strengths: found,
      fixes: fixes.slice(0, MAX_FIXES),
      notes,
      index: 0,
      offline: matches === null,
    });
  };

  if (review.status !== "ready") {
    const tooShort = s.count < MIN_WORDS;
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <button
          type="button"
          onClick={check}
          disabled={tooShort || review.status === "checking"}
          className="w-full rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98] disabled:opacity-50"
        >
          {review.status === "checking" ? "Đang đọc bài của bạn…" : "✨ Nhận xét bài viết"}
        </button>
        <p className="text-xs leading-relaxed text-muted">
          {tooShort ? `Viết ít nhất ${MIN_WORDS} từ để nhận nhận xét nhé.` : CHECK_NOTE}
        </p>
      </div>
    );
  }

  const { fixes, notes, index } = review;
  const total = fixes.length + notes.length;
  const next = (changes: Partial<Extract<Review, { status: "ready" }>> = {}) =>
    setReview({ ...review, ...changes, index: index + 1 });
  const edited = text !== review.checked;

  return (
    <section aria-label="Nhận xét" className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4" aria-live="polite">
      <ul className="flex flex-col gap-1.5">
        {praiseLines(review.strengths, fixes.length).map((line, i) => (
          <li key={i} className={i === 0 ? "text-lg font-medium" : "leading-relaxed"}>
            {line}
          </li>
        ))}
      </ul>
      {review.offline && <p className="text-sm text-muted">{OFFLINE_NOTE}</p>}

      {index < total && (
        <div className="rounded-xl bg-paper px-4 py-3">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Gợi ý {index + 1}/{total}
          </p>
          {index < fixes.length ? (
            <FixCard
              fix={fixes[index]}
              text={text}
              onAccept={(replacement) => {
                const applied = applyFix(text, fixes[index], replacement);
                if (!applied) return next();
                onChange(applied.text);
                next({ checked: applied.text, fixes: shiftFixes(fixes, applied.offset, applied.delta) });
              }}
              onSkip={() => next()}
            />
          ) : (
            <NoteCard
              kind={notes[index - fixes.length]}
              strengths={review.strengths}
              pattern={pattern}
              onInsertPattern={() => {
                const result = insertSnippet(text, text.length, text.length, pattern);
                onChange(result.text, result.cursor);
                next({ checked: result.text });
              }}
              onDone={() => next()}
            />
          )}
        </div>
      )}

      {index >= total && total > 0 && (
        <p className="leading-relaxed">Bạn đã xem hết góp ý rồi. Đọc lại bài một lần nữa, sửa thêm nếu muốn nhé.</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{edited ? "Bài đã thay đổi sau lần nhận xét này." : ""}</p>
        <button
          type="button"
          onClick={check}
          disabled={s.count < MIN_WORDS}
          className="shrink-0 rounded-full border border-wine/40 px-4 py-1.5 text-sm font-medium text-wine transition active:scale-[0.97] disabled:opacity-50"
        >
          Nhận xét lại
        </button>
      </div>
    </section>
  );
}

function FixCard({
  fix,
  text,
  onAccept,
  onSkip,
}: {
  fix: Fix;
  text: string;
  onAccept: (replacement: string) => void;
  onSkip: () => void;
}) {
  const at = locate(text, fix);
  if (at === null) {
    return (
      <div className="mt-1 flex items-center justify-between gap-3">
        <p>Chỗ này bạn đã tự sửa rồi 👍</p>
        <SmallButton onClick={onSkip}>Tiếp</SmallButton>
      </div>
    );
  }
  return (
    <div className="mt-1 flex flex-col gap-2">
      <p className="leading-relaxed">{fixMessage(fix.kind, fix.flagged)}</p>
      <Context text={text} offset={at} length={fix.length} />
      {fix.detail && (
        <p lang="en" className="text-xs text-muted italic">
          {fix.detail}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {fix.replacements.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onAccept(r)}
            className="rounded-full bg-wine px-4 py-1.5 text-sm font-medium text-paper transition active:scale-[0.97]"
          >
            Sửa thành “<span lang="en">{r.trim() || "(xoá)"}</span>”
          </button>
        ))}
        <SmallButton onClick={onSkip}>{fix.replacements.length ? "Bỏ qua" : "Mình sẽ tự sửa"}</SmallButton>
      </div>
    </div>
  );
}

function NoteCard({
  kind,
  strengths,
  pattern,
  onInsertPattern,
  onDone,
}: {
  kind: NoteKind;
  strengths: Strengths;
  pattern: string;
  onInsertPattern: () => void;
  onDone: () => void;
}) {
  return (
    <div className="mt-1 flex flex-col gap-2">
      <p className="leading-relaxed">{noteMessage(kind, strengths, pattern)}</p>
      <div className="flex flex-wrap gap-2">
        {kind === "pattern" && (
          <button
            type="button"
            onClick={onInsertPattern}
            className="rounded-full bg-wine px-4 py-1.5 text-sm font-medium text-paper transition active:scale-[0.97]"
          >
            Chèn mẫu câu
          </button>
        )}
        <SmallButton onClick={onDone}>{kind === "pattern" ? "Để sau" : "Đã hiểu"}</SmallButton>
      </div>
    </div>
  );
}

/** The words around a suggestion, with the flagged part marked. */
function Context({ text, offset, length }: { text: string; offset: number; length: number }) {
  const start = Math.max(0, text.lastIndexOf(" ", Math.max(0, offset - 30)) + 1);
  const endSpace = text.indexOf(" ", offset + length + 30);
  const end = endSpace === -1 ? text.length : endSpace;
  return (
    <p lang="en" className="font-serif text-lg leading-relaxed">
      {start > 0 && "…"}
      {text.slice(start, offset)}
      <mark className="rounded bg-wine/10 px-0.5 text-wine underline decoration-wine/60 decoration-dotted decoration-2 underline-offset-4">
        {text.slice(offset, offset + length) || " "}
      </mark>
      {text.slice(offset + length, end)}
      {end < text.length && "…"}
    </p>
  );
}

function SmallButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-line px-4 py-1.5 text-sm font-medium transition active:scale-[0.97]"
    >
      {children}
    </button>
  );
}
