"use client";

import { useState } from "react";
import { plainText, type StoryNode } from "@/lib/schema";

type ChoiceNode = Extract<StoryNode, { type: "choice" }>;
type Props = { node: ChoiceNode; onChoose: (optionIndex: number) => void };

/**
 * The learner's reply options. Every option leads on: there is no wrong answer.
 * Hints come in tiers: first the hint, then the Vietnamese of each option.
 * Key this component by node id so the tiers reset for each new choice.
 */
export default function ChoiceButtons({ node, onChoose }: Props) {
  const [tier, setTier] = useState<0 | 1 | 2>(0);
  const hasTranslations = node.options.some((o) => o.vi);
  const nextTier = tier === 0 ? "💡 Gợi ý" : tier === 1 && hasTranslations ? "Dịch các câu trả lời" : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3 px-1">
        <p className="text-muted italic">{node.prompt}</p>
        {nextTier && (
          <button
            type="button"
            onClick={() => setTier(tier === 0 ? 1 : 2)}
            className="min-h-8 shrink-0 rounded-full border border-wine/30 bg-card px-3 py-1 text-sm text-wine transition-colors hover:border-wine/60"
          >
            {nextTier}
          </button>
        )}
      </div>

      {tier >= 1 && (
        <p role="status" className="rounded-2xl bg-wine/[0.06] px-4 py-2.5 leading-relaxed text-ink/90 italic">
          {node.hint}
        </p>
      )}

      {node.options.map((option, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChoose(i)}
          className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left transition-[border-color,box-shadow,transform] hover:border-wine/50 hover:shadow-paper active:scale-[0.99]"
        >
          <span className="min-w-0 flex-1">
            <span lang="en" className="block text-[1.05rem] leading-snug">
              {plainText(option.text)}
            </span>
            {tier === 2 && option.vi && <span className="mt-1 block text-sm text-muted italic">{option.vi}</span>}
          </span>
          <span aria-hidden className="text-lg text-wine/60 transition-transform group-hover:translate-x-0.5">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}
