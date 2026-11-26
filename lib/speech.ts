// Thin, promise-based wrappers around the browser's Web Speech API.
// Recognition exists in Chrome, Edge and Safari (prefixed as
// webkitSpeechRecognition); Firefox has none. Every entry point checks for
// support first and reports problems as friendly reasons, never by throwing.

// TypeScript's DOM types do not include SpeechRecognition yet, so here is the
// small part this app uses.
type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = { isFinal: boolean; length: number; [index: number]: RecognitionAlternative };
type RecognitionEvent = { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } };
type RecognitionErrorEvent = { error: string };

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True if this browser can listen to the learner. */
export function isRecognitionSupported(): boolean {
  return recognitionConstructor() !== null;
}

/** True if this browser can read a line aloud. */
export function isSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export type RecognitionFailure =
  | "unsupported" // no SpeechRecognition (Firefox)
  | "denied" // microphone permission refused
  | "no-mic" // no microphone found
  | "no-audio" // the microphone never started recording
  | "quiet" // recording, but no sound reached the microphone
  | "unclear" // sound was heard, but no words were recognised
  | "no-reply" // speech was captured, but the speech service never answered
  | "network" // the browser's speech service could not be reached
  | "aborted" // stopped by the app
  | "error"; // anything else

/** How far listening got: used to explain why nothing was recognised. */
export type ListenStage = "starting" | "recording" | "sound";

export type RecognitionOutcome =
  | { ok: true; alternatives: string[] }
  | {
      ok: false;
      reason: RecognitionFailure;
      /** What the browser reported, in order, e.g. "audiostart 0.3s · soundstart 1.2s · error:no-speech 6.0s". */
      trace?: string;
    };

export type RecognitionSession = {
  /** Stop listening and use what was heard so far. */
  stop(): void;
  /** Stop listening and throw away the attempt. */
  cancel(): void;
  result: Promise<RecognitionOutcome>;
};

type ListenOptions = {
  lang?: string;
  /** A safety limit only: listening normally runs until stop() (the learner presses "Đọc xong"). */
  maxSeconds?: number;
  /** Called with the words heard so far, while the learner speaks. */
  onInterim?: (text: string) => void;
  /** Called when the microphone starts recording, and when it first picks up sound. */
  onStage?: (stage: ListenStage) => void;
};

const ERROR_REASONS: Record<string, RecognitionFailure> = {
  "not-allowed": "denied",
  "service-not-allowed": "denied",
  "audio-capture": "no-mic",
  network: "network",
  aborted: "aborted",
};

/** Browsers end a session on their own (after a pause, or a time limit); it is restarted at most this often. */
const MAX_RESTARTS = 20;

/**
 * Listen until stop() is called: the learner decides when they have finished
 * reading. If the browser ends the session on its own (a pause, its own time
 * limit), listening restarts and the words heard so far are kept. Resolves
 * with up to 5 alternatives (best first), or a reason.
 */
export function listen({ lang = "en-US", maxSeconds = 60, onInterim, onStage }: ListenOptions = {}): RecognitionSession {
  const Ctor = recognitionConstructor();
  if (!Ctor) {
    return { stop() {}, cancel() {}, result: Promise.resolve({ ok: false, reason: "unsupported" }) };
  }

  let recognition: Recognition;
  try {
    recognition = new Ctor();
  } catch {
    return { stop() {}, cancel() {}, result: Promise.resolve({ ok: false, reason: "error" }) };
  }
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;

  /** Best words from sessions the browser ended on its own, before a restart. */
  let earlier = "";
  let finals: RecognitionResult[] = [];
  /** Everything heard in this session, final or not: used if the service never finalises. */
  let heard = "";
  let failure: RecognitionFailure | null = null;
  let stage: ListenStage = "starting";
  let running = false;
  let stopping = false;
  let restarts = 0;
  let settled = false;
  const startedAt = Date.now();
  const events: string[] = [];
  const note = (event: string) => events.push(`${event} ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;
  let grace: ReturnType<typeof setTimeout> | undefined;
  let resolveResult: (outcome: RecognitionOutcome) => void = () => {};
  const result = new Promise<RecognitionOutcome>((resolve) => (resolveResult = resolve));

  const settle = (outcome: RecognitionOutcome) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    clearTimeout(grace);
    resolveResult(outcome);
  };

  const join = (...parts: string[]) => parts.filter(Boolean).join(" ").trim();

  /** `timedOut`: the browser never ended the session after stop(), so its service never answered. */
  const outcomeSoFar = (timedOut = false): RecognitionOutcome => {
    // Build each alternative across all final results ("first part" + "second part").
    const count = Math.max(0, ...finals.map((r) => r.length));
    const alternatives = Array.from({ length: count }, (_, i) =>
      join(earlier, ...finals.map((r) => (r[i] ?? r[0])?.transcript ?? "")),
    ).filter(Boolean);
    if (alternatives.length > 0) return { ok: true, alternatives: [...new Set(alternatives)] };
    const words = join(earlier, heard);
    if (words) return { ok: true, alternatives: [words] };
    const trace = events.join(" · ");
    if (failure) return { ok: false, reason: failure, trace };
    if (timedOut && stage === "sound") return { ok: false, reason: "no-reply", trace };
    return { ok: false, reason: stage === "starting" ? "no-audio" : stage === "recording" ? "quiet" : "unclear", trace };
  };

  recognition.onresult = (event) => {
    note("result");
    const results = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
    finals = results.filter((r) => r.isFinal);
    heard = results.map((r) => r[0]?.transcript ?? "").join(" ").trim();
    onInterim?.(join(earlier, heard));
  };
  recognition.onerror = (event) => {
    note(`error:${event.error}`);
    // "no-speech" (a pause) is not a failure: listening goes on until the learner stops.
    if (event.error !== "no-speech") failure = ERROR_REASONS[event.error] ?? "error";
  };
  const reach = (next: ListenStage) => {
    if (stage === "sound" || stage === next) return;
    stage = next;
    onStage?.(next);
  };
  recognition.onaudiostart = () => {
    note("audiostart");
    reach("recording");
  };
  recognition.onsoundstart = () => {
    note("soundstart");
    reach("sound");
  };
  recognition.onspeechstart = () => {
    note("speechstart");
    reach("sound");
  };

  const begin = (): boolean => {
    try {
      recognition.start();
      running = true;
      return true;
    } catch {
      return false;
    }
  };

  recognition.onend = () => {
    note("end");
    running = false;
    if (stopping || failure || settled) {
      settle(outcomeSoFar());
      return;
    }
    // The browser ended on its own while the learner may still be reading: keep listening.
    earlier = join(earlier, heard);
    finals = [];
    heard = "";
    if (restarts >= MAX_RESTARTS || !begin()) {
      settle(outcomeSoFar());
      return;
    }
    restarts++;
    note("restart");
  };

  const abort = () => {
    try {
      recognition.abort();
    } catch {
      // Already stopped.
    }
  };

  // Chrome's stop() waits for its online service to send the final words.
  // When that is slow, or nothing was heard, "end" can come late or never,
  // so after a short grace period use what was heard so far.
  const stop = () => {
    if (settled || stopping) return;
    stopping = true;
    note("stop");
    if (!running) {
      settle(outcomeSoFar());
      return;
    }
    try {
      recognition.stop();
    } catch {
      // Already stopped.
    }
    grace = setTimeout(() => {
      note("no-end");
      settle(outcomeSoFar(true));
      abort();
    }, STOP_GRACE_MS);
  };

  if (!begin()) {
    return { stop() {}, cancel() {}, result: Promise.resolve({ ok: false, reason: "error" }) };
  }
  timer = setTimeout(stop, maxSeconds * 1000);

  return {
    stop,
    cancel: () => {
      stopping = true;
      settle({ ok: false, reason: "aborted" });
      abort();
    },
    result,
  };
}

/** How long stop() waits for the browser's final result before giving up on it. */
const STOP_GRACE_MS = 4000;

/** An English voice, preferring American and on-device voices. */
function englishVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === lang && v.localService) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

/**
 * Read a line aloud with the browser's built-in voice. Resolves when it ends
 * (or at once if speech synthesis is unavailable). `rate` below 1 is slower.
 */
export function speak(text: string, { rate = 0.9, lang = "en-US" }: { rate?: number; lang?: string } = {}): Promise<void> {
  if (!isSynthesisSupported()) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      const voice = englishVoice(lang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/** The recording playing now, so stopSpeaking() can stop it too. */
let playing: HTMLAudioElement | null = null;

/**
 * Play a recorded line. `rate` below 1 is slower, keeping the pitch.
 * Resolves true when it played to the end (or was stopped), false if it
 * could not play, so the caller can fall back to speak().
 */
export function playRecording(src: string, { rate = 1 }: { rate?: number } = {}): Promise<boolean> {
  if (typeof Audio === "undefined") return Promise.resolve(false);
  stopSpeaking();
  return new Promise((resolve) => {
    try {
      const audio = new Audio(src);
      audio.preservesPitch = true;
      audio.playbackRate = rate;
      playing = audio;
      const done = (ok: boolean) => {
        if (playing === audio) playing = null;
        audio.onended = audio.onerror = audio.onpause = null;
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onpause = () => done(true); // stopped by stopSpeaking()
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    } catch {
      resolve(false);
    }
  });
}

/** Stop any line being read aloud or played. */
export function stopSpeaking(): void {
  try {
    playing?.pause();
    playing = null;
    if (isSynthesisSupported()) window.speechSynthesis.cancel();
  } catch {
    // Nothing to stop.
  }
}
