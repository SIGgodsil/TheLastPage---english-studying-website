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
  | "no-speech" // nothing was heard
  | "network" // the browser's speech service could not be reached
  | "aborted" // stopped by the app
  | "error"; // anything else

export type RecognitionOutcome =
  | { ok: true; alternatives: string[] }
  | { ok: false; reason: RecognitionFailure };

export type RecognitionSession = {
  /** Stop listening and use what was heard so far. */
  stop(): void;
  /** Stop listening and throw away the attempt. */
  cancel(): void;
  result: Promise<RecognitionOutcome>;
};

type ListenOptions = {
  lang?: string;
  /** Stop on its own after this many seconds. */
  maxSeconds?: number;
  /** Called with the words heard so far, while the learner speaks. */
  onInterim?: (text: string) => void;
};

const ERROR_REASONS: Record<string, RecognitionFailure> = {
  "not-allowed": "denied",
  "service-not-allowed": "denied",
  "audio-capture": "no-mic",
  "no-speech": "no-speech",
  network: "network",
  aborted: "aborted",
};

/** Listen for one utterance. Resolves with up to 5 alternatives (best first), or a reason. */
export function listen({ lang = "en-US", maxSeconds = 8, onInterim }: ListenOptions = {}): RecognitionSession {
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
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;

  let finals: RecognitionResult[] = [];
  let failure: RecognitionFailure | null = null;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const result = new Promise<RecognitionOutcome>((resolve) => {
    recognition.onresult = (event) => {
      const results = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
      finals = results.filter((r) => r.isFinal);
      onInterim?.(results.map((r) => r[0]?.transcript ?? "").join(" ").trim());
    };
    recognition.onerror = (event) => {
      failure = ERROR_REASONS[event.error] ?? "error";
    };
    recognition.onend = () => {
      clearTimeout(timer);
      if (cancelled) return resolve({ ok: false, reason: "aborted" });
      // Build each alternative across all final results ("first part" + "second part").
      const count = Math.max(0, ...finals.map((r) => r.length));
      const alternatives = Array.from({ length: count }, (_, i) =>
        finals.map((r) => (r[i] ?? r[0])?.transcript ?? "").join(" ").trim(),
      ).filter(Boolean);
      if (alternatives.length > 0) return resolve({ ok: true, alternatives: [...new Set(alternatives)] });
      resolve({ ok: false, reason: failure ?? "no-speech" });
    };
  });

  try {
    recognition.start();
    timer = setTimeout(() => recognition.stop(), maxSeconds * 1000);
  } catch {
    return { stop() {}, cancel() {}, result: Promise.resolve({ ok: false, reason: "error" }) };
  }

  return {
    stop: () => recognition.stop(),
    cancel: () => {
      cancelled = true;
      recognition.abort();
    },
    result,
  };
}

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

/** Stop any line being read aloud. */
export function stopSpeaking(): void {
  try {
    if (isSynthesisSupported()) window.speechSynthesis.cancel();
  } catch {
    // Nothing to stop.
  }
}
