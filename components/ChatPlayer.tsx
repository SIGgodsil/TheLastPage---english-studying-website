"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  advance,
  choose,
  currentNode,
  isAwaitingChoice,
  isPageEnd,
  restore,
  startPage,
  transcript,
  type PlayState,
  type Step,
} from "@/lib/engine";
import type { Page, StoryNode } from "@/lib/schema";
import type { Glossary } from "@/lib/vocab";
import { completePage, savePlay, storyProgress } from "@/lib/storage";
import ChatBubble from "./ChatBubble";
import ChoiceButtons from "./ChoiceButtons";
import NarrationLine from "./NarrationLine";
import PageEnd from "./PageEnd";
import TypingIndicator from "./TypingIndicator";
import { WordProvider } from "./WordContext";

type Props = {
  storyId: string;
  page: Page;
  totalPages: number;
  /** Vocab from this page and earlier ones, for tap-to-understand. */
  glossary: Glossary;
};

const noSubscribe = () => () => {};

/**
 * Plays one page as a chat. Renders only in the browser, because the saved
 * position lives in localStorage and the server cannot see it.
 */
export default function ChatPlayer(props: Props) {
  const isClient = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!isClient) return <div className="flex-1" aria-busy />;
  return <ChatSession key={`${props.storyId}/${props.page.page}`} {...props} />;
}

/** The saved position on this page, or the start of the page. */
function initialState(storyId: string, page: Page): PlayState {
  const saved = storyProgress(storyId).play;
  if (saved && saved.page === page.page) {
    const restored = restore(page, saved);
    if (restored) return restored;
  }
  return startPage(page);
}

/** Nodes that a character "types": they get the typing indicator first. */
function speakerOf(node: StoryNode): string | null {
  if (node.type === "message" || node.type === "shadow") return node.from;
  if (node.type === "cliffhanger") return node.from ?? null;
  return null;
}

/** Long enough to feel like typing, short enough not to bore. */
function typingDelay(text: string): number {
  return Math.min(1500, 450 + text.length * 15);
}

function ChatSession({ storyId, page, totalPages, glossary }: Props) {
  const [play, setPlay] = useState(() => initialState(storyId, page));
  const [typing, setTyping] = useState(false);
  const timer = useRef<number | null>(null);

  const stopTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stopTimer, []);

  // Keep the newest line in view. Scroll to the very bottom of the page so the
  // sticky footer (which can grow to hold choices) never covers the last line.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [play.path.length, typing]);

  const goTo = (next: PlayState) => {
    setPlay(next);
    if (isPageEnd(page, next)) completePage(storyId, page.page);
    else savePlay(storyId, page.page, next);

    const node = currentNode(page, next);
    if (speakerOf(node) && "text" in node) {
      stopTimer();
      setTyping(true);
      timer.current = window.setTimeout(() => setTyping(false), typingDelay(node.text));
    }
  };

  const onContinue = () => {
    if (typing) {
      // Tapping while someone types shows the message at once.
      stopTimer();
      setTyping(false);
      return;
    }
    goTo(advance(page, play));
  };

  const steps = transcript(page, play);
  const node = currentNode(page, play);
  const groupChat = Object.keys(page.characters).length > 1;

  return (
    <WordProvider glossary={glossary} pageNumber={page.page}>
      <div role="log" aria-live="polite" className="flex flex-1 flex-col gap-2 px-3 pt-4 pb-6">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          if (isLast && typing) {
            const from = speakerOf(step.node);
            const character = from ? page.characters[from] : undefined;
            return character ? <TypingIndicator key="typing" name={character.name} emoji={character.emoji} /> : null;
          }
          return (
            <StepView
              key={step.node.id}
              step={step}
              page={page}
              previous={steps[i - 1]}
              groupChat={groupChat}
            />
          );
        })}
      </div>

      <footer className="sticky bottom-0 border-t border-line bg-paper/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {!typing && isAwaitingChoice(page, play) && node.type === "choice" ? (
          <ChoiceButtons key={node.id} node={node} onChoose={(i) => goTo(choose(page, play, i))} />
        ) : !typing && isPageEnd(page, play) ? (
          <PageEnd storyId={storyId} pageNumber={page.page} totalPages={totalPages} />
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-full bg-ink px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
          >
            {typing ? "Xem ngay" : "Tiếp"}
          </button>
        )}
      </footer>
    </WordProvider>
  );
}

type StepViewProps = { step: Step; page: Page; previous?: Step; groupChat: boolean };

/** One step of the transcript. */
function StepView({ step, page, previous, groupChat }: StepViewProps) {
  const { node } = step;

  if (node.type === "choice") {
    // An answered choice is the learner's own message; an open one shows in the footer.
    return step.pick === undefined ? null : <ChatBubble side="learner" text={node.options[step.pick].text} />;
  }

  if (node.type === "narration") return <NarrationLine text={node.text} vi={node.vi} />;

  if (node.type === "free-reply") {
    // Typed replies are a B1 extra, not built yet: show the task so the page still makes sense.
    return <NarrationLine text={node.prompt} />;
  }

  if (node.type === "cliffhanger" && !node.from) return <NarrationLine text={node.text} vi={node.vi} accent />;

  const from = node.from!;
  const character = page.characters[from];
  // A new run starts when the speaker changes (or after a narration or learner line).
  const previousFrom =
    previous && (previous.node.type === "message" || previous.node.type === "shadow") ? previous.node.from : null;
  const startsRun = previousFrom !== from;

  return (
    <div className={startsRun ? "mt-2" : undefined}>
      <ChatBubble
        side="character"
        name={character.name}
        emoji={character.emoji}
        showName={groupChat && startsRun}
        showAvatar={startsRun}
        text={node.text}
        vi={node.vi}
        voice={node.voice}
        accent={node.type === "cliffhanger"}
        footer={node.type === "shadow" ? <ShadowSoon /> : undefined}
      />
    </div>
  );
}

/** Placeholder for the shadowing button (next milestone). */
function ShadowSoon() {
  return (
    <button
      type="button"
      disabled
      title="Luyện nói: sắp có"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted"
    >
      <span aria-hidden>🎙️</span> Luyện nói · sắp có
    </button>
  );
}
