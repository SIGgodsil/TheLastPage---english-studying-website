import type { StoryNode } from "@/lib/schema";
import { plainText } from "@/lib/schema";

type ChoiceNode = Extract<StoryNode, { type: "choice" }>;
type Props = { node: ChoiceNode; onChoose: (optionIndex: number) => void };

/**
 * The learner's reply options. Every option leads on: there is no wrong answer.
 * (MVP phase 4 adds tiered hints.)
 */
export default function ChoiceButtons({ node, onChoose }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-sm text-muted">{node.prompt}</p>
      {node.options.map((option, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChoose(i)}
          className="w-full rounded-2xl border border-wine/40 bg-card px-4 py-3 text-left leading-snug transition hover:border-wine active:scale-[0.98]"
        >
          {plainText(option.text)}
        </button>
      ))}
    </div>
  );
}
