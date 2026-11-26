"use client";

import { useState } from "react";
import { ENDING_TARGET, wordCount } from "@/lib/ending";
import type { LastPage } from "@/lib/schema";

export type Mood = LastPage["moods"][number]["id"];

export const MOOD_LABEL: Record<Mood, { emoji: string; label: string }> = {
  happy: { emoji: "🌅", label: "Có hậu" },
  sad: { emoji: "🥀", label: "Buồn" },
  twist: { emoji: "🌀", label: "Bất ngờ" },
};

/** Three mood cards; the picked one shows its hint. Picking again un-picks it. */
export function MoodPicker({
  moods,
  value,
  onChange,
}: {
  moods: LastPage["moods"];
  value?: Mood;
  onChange: (mood?: Mood) => void;
}) {
  const picked = moods.find((m) => m.id === value);
  return (
    <div>
      <div role="radiogroup" aria-label="Kiểu kết thúc" className="grid grid-cols-3 gap-2">
        {moods.map(({ id }) => {
          const checked = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(checked ? undefined : id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-sm font-medium transition active:scale-[0.97] ${
                checked ? "border-wine bg-wine/5 text-wine" : "border-line bg-card"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {MOOD_LABEL[id].emoji}
              </span>
              {MOOD_LABEL[id].label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted italic" aria-live="polite">
        {picked ? picked.hintVi : "Chọn một kiểu nếu bạn cần ý tưởng, hoặc cứ viết theo ý mình."}
      </p>
    </div>
  );
}

/** Sentence starters as chips; tapping one inserts it at the cursor. */
export function StarterChips({ starters, onPick }: { starters: string[]; onPick: (starter: string) => void }) {
  return (
    <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {starters.map((starter) => (
        <button
          key={starter}
          type="button"
          lang="en"
          onClick={() => onPick(starter)}
          className="shrink-0 snap-start rounded-full border border-line bg-card px-3 py-1.5 font-serif text-sm italic transition hover:border-wine/40 active:scale-[0.97]"
        >
          {starter}
        </button>
      ))}
    </div>
  );
}

/** Word count against the goal, with the optional B1 challenge. */
export function WordCounter({ count }: { count: number }) {
  const { min, max, challenge } = ENDING_TARGET;
  const status =
    count >= challenge
      ? "🏅 Thử thách B1: hoàn thành!"
      : count >= min
        ? count > max
          ? `Tuyệt! Viết tới ${challenge} từ là hoàn thành thử thách B1.`
          : "✓ Đủ độ dài rồi"
        : count === 0
          ? `Mục tiêu: ${min}–${max} từ`
          : `Còn khoảng ${min - count} từ nữa`;
  return (
    <div className="text-sm">
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-medium tabular-nums">{count} từ</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <span
            className={`block h-full rounded-full transition-[width] ${count >= min ? "bg-wine" : "bg-wine/50"}`}
            style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
          />
        </span>
      </div>
      <p className="mt-1 text-muted" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

/** The story's words: used ones are marked; tap one for its meaning and to insert it. */
export function WordBank({
  words,
  used,
  onInsert,
}: {
  words: LastPage["wordBank"];
  used: Set<string>;
  onInsert: (word: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const entry = words.find((w) => w.word === selected);
  return (
    <div>
      <p className="text-sm font-medium">
        Dùng từ bạn đã học{" "}
        <span className="text-muted">
          · {used.size}/{words.length}
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {words.map(({ word }) => {
          const isUsed = used.has(word);
          return (
            <li key={word}>
              <button
                type="button"
                lang="en"
                aria-pressed={word === selected}
                onClick={() => setSelected(word === selected ? null : word)}
                className={`rounded-full border px-3 py-1 text-sm transition active:scale-[0.97] ${
                  isUsed ? "border-wine bg-wine text-paper" : "border-line bg-card"
                } ${word === selected ? "ring-2 ring-wine/40 ring-offset-2 ring-offset-paper" : ""}`}
              >
                {isUsed && <span aria-label="đã dùng">✓ </span>}
                {word}
              </button>
            </li>
          );
        })}
      </ul>
      {entry && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3">
          <p>
            <span lang="en" className="font-serif text-lg font-semibold text-wine">
              {entry.word}
            </span>{" "}
            <span className="text-muted">· {entry.vi}</span>
          </p>
          <button
            type="button"
            onClick={() => onInsert(entry.word)}
            className="shrink-0 rounded-full border border-wine/40 px-3 py-1 text-sm font-medium text-wine transition active:scale-[0.97]"
          >
            Chèn vào bài
          </button>
        </div>
      )}
    </div>
  );
}

/** An ending shown as a finished card: the mood, the text, and its length. */
export function EndingCard({ mood, text, label }: { mood?: Mood; text: string; label: string }) {
  const count = wordCount(text);
  return (
    <figure className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <figcaption className="flex items-center justify-between gap-3 text-xs font-medium tracking-wide text-muted uppercase">
        <span>{label}</span>
        {mood && (
          <span className="rounded-full bg-wine/5 px-2.5 py-1 tracking-normal text-wine normal-case">
            <span aria-hidden>{MOOD_LABEL[mood].emoji} </span>
            {MOOD_LABEL[mood].label}
          </span>
        )}
      </figcaption>
      <blockquote lang="en" className="mt-3 font-serif text-lg leading-relaxed break-words whitespace-pre-wrap">
        {text}
      </blockquote>
      <p className="mt-3 text-right text-xs text-muted">{count} từ</p>
    </figure>
  );
}
