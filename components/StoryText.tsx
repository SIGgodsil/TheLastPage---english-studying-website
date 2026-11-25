import { segments } from "@/lib/vocab";

type Props = { text: string };

/**
 * Story text with its [[vocab]] marks rendered as highlighted words.
 * (MVP phase 4 makes the words tappable.)
 */
export default function StoryText({ text }: Props) {
  return (
    <>
      {segments(text).map((s, i) =>
        s.kind === "text" ? (
          <span key={i}>{s.text}</span>
        ) : (
          <span key={i} className="underline decoration-wine/50 decoration-dotted decoration-2 underline-offset-4">
            {s.shown}
          </span>
        ),
      )}
    </>
  );
}
