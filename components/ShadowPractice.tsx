"use client";

import { useEffect, useRef, useState } from "react";
import { AUDIO_CREDIT, shadowAudio } from "@/lib/audio";
import { plainText } from "@/lib/schema";
import { checkShadow, GREAT, type ShadowResult, type ShadowWord } from "@/lib/shadow";
import {
  isRecognitionSupported,
  isSynthesisSupported,
  listen,
  playRecording,
  speak,
  stopSpeaking,
  type ListenStage,
  type RecognitionSession,
} from "@/lib/speech";
import { saveShadow, shadowKey } from "@/lib/storage";
import BottomSheet, { CloseButton } from "./BottomSheet";
import { FAILURE, PRAISE, tipMessage } from "./shadowCopy";
import { useProgress } from "./useProgress";

type Line = {
  /** The line to repeat (may contain [[vocab]] marks). */
  text: string;
  vi: string;
  /** Character names on this page: never held against the learner. */
  names: string[];
};

type Props = Line & {
  storyId: string;
  page: number;
  nodeId: string;
  /** "chip" sits under the chat bubble; "wide" is a full-width button (end-of-page screen). */
  variant?: "chip" | "wide";
};

/** The 🎙️ button for a shadow line, and the practice sheet it opens. */
export default function ShadowPractice({ storyId, page, nodeId, variant = "chip", ...line }: Props) {
  const [open, setOpen] = useState(false);
  const progress = useProgress();
  const best = progress?.stories[storyId]?.shadow?.[shadowKey(page, nodeId)];
  const close = () => setOpen(false);
  const onResult = (result: ShadowResult) => {
    if (result.tier !== "silent") saveShadow(storyId, page, nodeId, result.score);
  };

  const practised = best !== undefined;
  const mark = practised ? (best >= GREAT ? "⭐" : "✓") : null;
  const label = practised ? "Luyện lại" : "Luyện nói";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={practised ? `${label} (đã luyện)` : label}
        className={
          variant === "wide"
            ? "flex w-full items-center justify-center gap-2 rounded-full border border-wine/40 bg-card px-6 py-3 font-medium text-wine transition hover:border-wine active:scale-[0.98]"
            : "inline-flex items-center gap-1.5 rounded-full border border-wine/40 bg-card px-3 py-1 text-xs font-medium text-wine transition hover:border-wine active:scale-[0.97]"
        }
      >
        <span aria-hidden>🎙️</span> {variant === "wide" && !practised ? "Luyện nói câu của trang này" : label}
        {mark && <span aria-hidden>{mark}</span>}
      </button>
      <BottomSheet open={open} onClose={close} labelledBy="shadow-sheet-title">
        <ShadowPanel {...line} audio={shadowAudio(storyId, page, nodeId)} onClose={close} onResult={onResult} />
      </BottomSheet>
    </>
  );
}

type Phase =
  | { kind: "ready" }
  | { kind: "listening"; interim: string; stage: ListenStage }
  | { kind: "result"; result: ShadowResult }
  | { kind: "failed"; reason: keyof typeof FAILURE; trace?: string };

type Speed = "normal" | "slow";

/** "Nghe chậm" for a recording: slowed with the pitch kept (lower sounds smeared). */
const RECORDING_SLOW = 0.65;

/** The sheet's content. Unmounted when the sheet closes, which cancels listening and speech. */
function ShadowPanel({
  text,
  vi,
  names,
  audio,
  onClose,
  onResult,
}: Line & { audio: string | null; onClose: () => void; onResult: (result: ShadowResult) => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: "ready" });
  const [speaking, setSpeaking] = useState<Speed | null>(null);
  const session = useRef<RecognitionSession | null>(null);
  const line = plainText(text);
  const canListen = isRecognitionSupported();
  const canSpeak = audio !== null || isSynthesisSupported();

  useEffect(
    () => () => {
      session.current?.cancel();
      stopSpeaking();
    },
    [],
  );

  const play = async (speed: Speed) => {
    setSpeaking(speed);
    // The recording when there is one; the browser's own voice otherwise (or if it fails to play).
    const played = audio !== null && (await playRecording(audio, { rate: speed === "slow" ? RECORDING_SLOW : 1 }));
    if (!played) await speak(line, { rate: speed === "slow" ? 0.5 : 0.9 });
    setSpeaking((current) => (current === speed ? null : current));
  };

  const record = async () => {
    stopSpeaking();
    setSpeaking(null);
    setPhase({ kind: "listening", interim: "", stage: "starting" });
    const current = listen({
      onInterim: (interim) =>
        setPhase((p) => (p.kind === "listening" ? { ...p, interim, stage: "sound" } : p)),
      onStage: (stage) => setPhase((p) => (p.kind === "listening" ? { ...p, stage } : p)),
    });
    session.current = current;
    const outcome = await current.result;
    if (session.current !== current) return; // cancelled or replaced
    session.current = null;
    if (outcome.ok) {
      const result = checkShadow(text, outcome.alternatives, names);
      onResult(result);
      setPhase({ kind: "result", result });
    }
    else if (outcome.reason === "aborted") setPhase({ kind: "ready" });
    else setPhase({ kind: "failed", reason: outcome.reason, trace: outcome.trace });
  };

  const result = phase.kind === "result" ? phase.result : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Luyện nói · đọc to theo câu này</p>
        <CloseButton onClose={onClose} />
      </div>

      <h2 id="shadow-sheet-title" lang="en" className="mt-1 font-serif text-2xl leading-snug font-semibold">
        {result && result.tier !== "silent" ? <MarkedLine words={result.words} /> : line}
      </h2>
      <p className="mt-2 text-muted">{vi}</p>

      {canSpeak && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ListenButton onClick={() => play("normal")} active={speaking === "normal"} disabled={phase.kind === "listening"}>
            🔊 Nghe
          </ListenButton>
          <ListenButton onClick={() => play("slow")} active={speaking === "slow"} disabled={phase.kind === "listening"}>
            🐢 Nghe chậm
          </ListenButton>
        </div>
      )}
      {audio && (
        <p className="mt-2 text-xs text-muted/70">
          Giọng đọc tạo bằng{" "}
          <a href={AUDIO_CREDIT.href} target="_blank" rel="noopener" className="underline underline-offset-2">
            {AUDIO_CREDIT.label}
          </a>
        </p>
      )}

      <div className="mt-6" aria-live="polite">
        {!canListen ? (
          <Message>{FAILURE.unsupported}</Message>
        ) : phase.kind === "ready" ? (
          <MicButton onClick={record} label="Bấm rồi đọc to câu trên" />
        ) : phase.kind === "listening" ? (
          <Listening interim={phase.interim} stage={phase.stage} onStop={() => session.current?.stop()} />
        ) : phase.kind === "failed" ? (
          <>
            <Message>{FAILURE[phase.reason]}</Message>
            {phase.trace && (
              <p className="mt-2 text-xs break-words text-muted/70">Chi tiết kỹ thuật: {phase.trace}</p>
            )}
          </>
        ) : (
          <Feedback result={phase.result} />
        )}
      </div>

      {canListen && (phase.kind === "result" || phase.kind === "failed") && (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={record}
            className={`flex-1 rounded-full px-5 py-3 font-medium transition active:scale-[0.98] ${
              result?.tier === "great" ? "border border-line" : "bg-wine text-paper"
            }`}
          >
            🎙️ Thử lại
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-full px-5 py-3 font-medium transition active:scale-[0.98] ${
              result?.tier === "great" ? "bg-ink text-paper" : "border border-line"
            }`}
          >
            Xong
          </button>
        </div>
      )}
      {!canListen && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-ink px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
        >
          Bỏ qua
        </button>
      )}
    </div>
  );
}

const WORD_CLASS: Record<ShadowWord["status"], string> = {
  ok: "",
  ending: "text-wine underline decoration-wine/60 decoration-dotted decoration-2 underline-offset-4",
  close: "text-wine underline decoration-wine/60 decoration-dotted decoration-2 underline-offset-4",
  missed: "text-muted underline decoration-muted/60 decoration-dashed decoration-1 underline-offset-4",
};

/** The line with words that were not heard clearly marked (gently). */
function MarkedLine({ words }: { words: ShadowWord[] }) {
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && " "}
          <span className={w.lenient && w.status !== "ok" ? "" : WORD_CLASS[w.status]}>{w.text}</span>
        </span>
      ))}
    </>
  );
}

function Feedback({ result }: { result: ShadowResult }) {
  return (
    <div className="rounded-2xl bg-card px-4 py-4">
      <p className="text-lg font-medium">{PRAISE[result.tier]}</p>
      {result.tip && result.tier !== "silent" && (
        <p className="mt-2 leading-relaxed">{tipMessage(result.tip.kind, result.tip.word, result.tier === "great")}</p>
      )}
      {result.heard && (
        <p className="mt-3 text-sm text-muted">
          Máy nghe được: <span lang="en" className="italic">“{result.heard}”</span>
        </p>
      )}
      {result.tier !== "great" && result.tier !== "silent" && (
        <p className="mt-2 text-xs text-muted">Từ được gạch chân là những từ máy nghe chưa rõ.</p>
      )}
    </div>
  );
}

function MicButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex size-20 items-center justify-center rounded-full bg-wine text-3xl text-paper shadow-lg transition active:scale-95"
      >
        🎙️
      </button>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

const STAGE_LABEL: Record<ListenStage, string> = {
  starting: "Đang bật micro…",
  recording: "Micro đang bật, chưa nghe thấy tiếng",
  sound: "Đã nghe thấy tiếng bạn",
};

function Listening({ interim, stage, onStop }: { interim: string; stage: ListenStage; onStop: () => void }) {
  const [stopping, setStopping] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-wine/30 motion-reduce:animate-none" />
        <span className="relative flex size-20 items-center justify-center rounded-full bg-wine text-3xl text-paper">
          🎙️
        </span>
      </span>
      <p className="font-medium">{stopping ? "Đang chấm câu bạn vừa đọc…" : "Đang nghe… Đọc xong thì bấm nút bên dưới nhé."}</p>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <span
          aria-hidden
          className={`size-2 rounded-full ${stage === "sound" ? "bg-wine" : stage === "recording" ? "bg-wine/40" : "bg-line"}`}
        />
        {STAGE_LABEL[stage]}
      </p>
      <p lang="en" className="min-h-6 text-muted italic">
        {interim}
      </p>
      <button
        type="button"
        onClick={() => {
          setStopping(true);
          onStop();
        }}
        disabled={stopping}
        className="rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98] disabled:opacity-50"
      >
        {stopping ? "Đang dừng…" : "✓ Đọc xong"}
      </button>
    </div>
  );
}

function Message({ children }: { children: string }) {
  return <p className="rounded-2xl bg-card px-4 py-4 leading-relaxed">{children}</p>;
}

function ListenButton({
  onClick,
  active,
  disabled,
  children,
}: {
  onClick: () => void;
  active: boolean;
  disabled: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50 ${
        active ? "border-wine bg-wine/10 text-wine" : "border-line bg-card"
      }`}
    >
      {children}
    </button>
  );
}
