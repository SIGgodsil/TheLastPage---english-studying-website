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
        <p className="text-sm text-muted">{node.prompt}</p>
        {nextTier && (
          <button
            type="button"
            onClick={() => setTier(tier === 0 ? 1 : 2)}
            className="shrink-0 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-wine"
          >
            {nextTier}
          </button>
        )}
      </div>

      {tier >= 1 && (
        <p role="status" className="rounded-xl bg-card px-3 py-2 text-sm leading-relaxed">
          {node.hint}
        </p>
      )}

      {node.options.map((option, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChoose(i)}
          className="w-full rounded-2xl border border-wine/40 bg-card px-4 py-3 text-left leading-snug transition hover:border-wine active:scale-[0.98]"
        >
          <span className="block">{plainText(option.text)}</span>
          {tier === 2 && option.vi && <span className="mt-1 block text-sm text-muted">{option.vi}</span>}
        </button>
      ))}
    </div>
  );
}
