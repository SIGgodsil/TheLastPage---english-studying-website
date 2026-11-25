import type { ReactNode } from "react";
import Avatar from "./Avatar";
import StoryText from "./StoryText";

type CharacterProps = {
  side: "character";
  name: string;
  emoji?: string;
  /** Show the avatar and name (first bubble of a run in a group chat). */
  showName: boolean;
  /** Show the avatar (first bubble of a run). Later bubbles in the run keep the space. */
  showAvatar: boolean;
  text: string;
  voice?: boolean;
  /** The cliffhanger line gets a wine-coloured edge. */
  accent?: boolean;
  /** Extra controls under the bubble (e.g. the shadowing button). */
  footer?: ReactNode;
};

type LearnerProps = { side: "learner"; text: string };

type Props = CharacterProps | LearnerProps;

/** One chat message, from a character (left) or from the learner (right). */
export default function ChatBubble(props: Props) {
  if (props.side === "learner") {
    return (
      <div className="flex justify-end pl-12">
        <p className="rounded-2xl rounded-br-md bg-wine px-4 py-2.5 leading-relaxed text-paper">
          <StoryText text={props.text} />
        </p>
      </div>
    );
  }

  const { name, emoji, showName, showAvatar, text, voice, accent, footer } = props;
  return (
    <div className="pr-10">
      {showName && <p className="mb-1 ml-11 text-xs font-medium text-muted">{name}</p>}
      <div className="flex items-end gap-2">
        <div className="w-8 shrink-0">{showAvatar && <Avatar emoji={emoji} name={name} size="sm" />}</div>
        <div
          className={`min-w-0 rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 leading-relaxed shadow-sm ${
            accent ? "border-wine/60" : "border-line"
          }`}
        >
          {voice && <VoiceNote />}
          <p className={voice ? "text-[0.95rem] italic" : undefined}>
            <StoryText text={text} />
          </p>
        </div>
      </div>
      {footer && <div className="mt-1.5 ml-11">{footer}</div>}
    </div>
  );
}

const BARS = [6, 12, 9, 16, 11, 7, 14, 10, 5, 13, 8, 15, 9, 6, 11, 7];

/** The top of a voice-note bubble: play icon and waveform. Audio comes later; the transcript is the text. */
function VoiceNote() {
  return (
    <div className="mb-2 flex items-center gap-2 text-wine" aria-label="Tin nhắn thoại" role="img">
      <span className="flex size-7 items-center justify-center rounded-full bg-wine text-xs text-paper">▶</span>
      <span className="flex h-4 items-center gap-[3px]">
        {BARS.map((h, i) => (
          <span key={i} className="w-[3px] rounded-full bg-wine/50" style={{ height: h }} />
        ))}
      </span>
      <span className="text-xs text-muted">Tin nhắn thoại</span>
    </div>
  );
}
