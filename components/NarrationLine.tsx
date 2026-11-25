import StoryText from "./StoryText";

type Props = { text: string; accent?: boolean };

/** A short scene line between messages: centred, italic, muted, no bubble. */
export default function NarrationLine({ text, accent }: Props) {
  return (
    <p
      className={`mx-auto max-w-[85%] py-1 text-center font-serif italic leading-relaxed ${
        accent ? "text-lg text-wine" : "text-muted"
      }`}
    >
      <StoryText text={text} />
    </p>
  );
}
