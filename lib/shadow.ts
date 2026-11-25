// Shadowing feedback: compare what the speech recognizer heard with the line
// the learner repeated, word by word, and choose kind feedback with at most one
// correction (CLAUDE.md UX rule 3; CONTEXT.md sections 4, 5 and 7).
// Pure functions: no browser APIs, so they can be tested with Node.

import { plainText } from "./schema.ts";

/** How one word of the line came out. */
export type WordStatus =
  | "ok" // heard as written
  | "ending" // heard without its last sound(s): "walks" → "walk", "asked" → "ask"
  | "close" // heard as a similar word: "like" → "lie"
  | "missed"; // not heard

export type ShadowWord = {
  /** The word as written in the line, punctuation included, e.g. "door!". */
  text: string;
  status: WordStatus;
  /** Names are hard for recognizers: a missed name does not lower the score. */
  lenient: boolean;
};

export type TipKind = "ending" | "th" | "word";

export type ShadowResult = {
  tier: "great" | "good" | "retry" | "silent";
  /** 0–1, share of the line that was heard well. */
  score: number;
  words: ShadowWord[];
  /** The one correction to show, naming a word (bare, without punctuation). */
  tip: { kind: TipKind; word: string } | null;
  /** What the recognizer heard (best alternative), for display. */
  heard: string;
};

/** Score thresholds for the tiers. */
export const GREAT = 0.85;
export const GOOD = 0.6;

// ---------- Normalising ----------

const CONTRACTIONS: Record<string, string> = {
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "can not",
  cannot: "can not",
  "won't": "will not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "couldn't": "could not",
  "shouldn't": "should not",
  "wouldn't": "would not",
  "haven't": "have not",
  "hasn't": "has not",
  "mustn't": "must not",
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "it's": "it is",
  "he's": "he is",
  "she's": "she is",
  "that's": "that is",
  "there's": "there is",
  "here's": "here is",
  "what's": "what is",
  "who's": "who is",
  "let's": "let us",
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "i'd": "i would",
  // Recognizers sometimes drop the apostrophe. Both sides are normalised the
  // same way, so the ambiguous "its" (possessive) still matches itself.
  its: "it is",
  dont: "do not",
  doesnt: "does not",
  didnt: "did not",
  cant: "can not",
  isnt: "is not",
  im: "i am",
};

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

/** One written word → the comparable tokens it stands for ("Don't!" → ["do", "not"]). */
export function normalizeWord(raw: string): string[] {
  const word = raw
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
  if (!word) return [];
  return word
    .split(/[-–—/]+/)
    .flatMap((part) => {
      const core = part.replace(/^'+|'+$/g, "");
      if (!core) return [];
      if (CONTRACTIONS[core]) return CONTRACTIONS[core].split(" ");
      if (/^\d+$/.test(core) && Number(core) < NUMBER_WORDS.length) return [NUMBER_WORDS[Number(core)]];
      // Possessives and leftovers: "jack's" → "jacks" (recognizers write both).
      return [core.replace(/'/g, "")];
    })
    .filter((t) => /[a-z0-9]/.test(t));
}

/** Everything the recognizer said → comparable tokens. */
export function normalizeSpeech(text: string): string[] {
  return text.split(/\s+/).flatMap(normalizeWord);
}

type TargetWord = { text: string; tokens: string[]; lenient: boolean };

const SENTENCE_END = /[.!?…]["”’)]*$/;

/**
 * Split a line into its written words. Names are lenient: words capitalised
 * mid-sentence, and any word of `names` (e.g. the page's character names).
 */
export function targetWords(line: string, names: string[] = []): TargetWord[] {
  const nameTokens = new Set(names.flatMap((n) => n.split(/\s+/)).flatMap(normalizeWord));
  const parts = plainText(line).split(/\s+/).filter(Boolean);
  return parts.map((text, i) => {
    const letters = text.replace(/^[^A-Za-z]+/, "");
    const sentenceStart = i === 0 || SENTENCE_END.test(parts[i - 1]);
    const capitalised = /^[A-Z]/.test(letters) && !/^I('|’|$)/.test(letters);
    const tokens = normalizeWord(text);
    const isName = capitalised && tokens.length > 0 && tokens.every((t) => nameTokens.has(t) || nameTokens.has(t.replace(/s$/, "")));
    return { text, tokens, lenient: (capitalised && !sentenceStart) || isName };
  });
}

// ---------- Comparing ----------

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** How a heard token compares with a target token, or null if it is a different word. */
function compareToken(target: string, heard: string): Exclude<WordStatus, "missed"> | null {
  if (target === heard) return "ok";
  // Dropped ending: the heard word is the target minus its last 1–2 letters.
  if (heard.length >= 2 && target.startsWith(heard) && target.length - heard.length <= 2) return "ending";
  const allowed = target.length >= 5 ? 2 : 1;
  if (target[0] === heard[0] && target.length >= 3 && levenshtein(target, heard) <= allowed) return "close";
  return null;
}

const MATCH_SCORE = { ok: 3, ending: 2, close: 1 } as const;
const GAP = -1;
const MISMATCH = -1.5;

/** Align target tokens with heard tokens; returns a status per target token. */
function align(target: string[], heard: string[]): WordStatus[] {
  const n = target.length;
  const m = heard.length;
  const score: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0)),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const c = compareToken(target[i - 1], heard[j - 1]);
      score[i][j] = Math.max(
        score[i - 1][j - 1] + (c ? MATCH_SCORE[c] : MISMATCH),
        score[i - 1][j] + GAP, // target token not said
        score[i][j - 1] + GAP, // extra heard token
      );
    }
  }
  const status: WordStatus[] = new Array(n).fill("missed");
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const c = compareToken(target[i - 1], heard[j - 1]);
    if (score[i][j] === score[i - 1][j - 1] + (c ? MATCH_SCORE[c] : MISMATCH)) {
      status[i - 1] = c ?? "missed";
      i--;
      j--;
    } else if (score[i][j] === score[i - 1][j] + GAP) {
      i--;
    } else {
      j--;
    }
  }
  return status;
}

const SEVERITY: Record<WordStatus, number> = { ok: 0, ending: 1, close: 2, missed: 3 };
const CREDIT: Record<WordStatus, number> = { ok: 1, ending: 0.6, close: 0.5, missed: 0 };

function judge(words: TargetWord[], heardText: string) {
  const targetTokens = words.flatMap((w) => w.tokens);
  const statuses = align(targetTokens, normalizeSpeech(heardText));
  let k = 0;
  const judged: ShadowWord[] = words.map((w) => {
    const own = statuses.slice(k, k + w.tokens.length);
    k += w.tokens.length;
    const status = own.reduce<WordStatus>((worst, s) => (SEVERITY[s] > SEVERITY[worst] ? s : worst), "ok");
    return { text: w.text, status, lenient: w.lenient };
  });
  let credit = 0;
  let counted = 0;
  judged.forEach((w, idx) => {
    if (words[idx].tokens.length === 0) return; // punctuation only
    if (w.lenient && w.status !== "ok") return; // a name it did not catch
    credit += CREDIT[w.status];
    counted++;
  });
  return { words: judged, score: counted === 0 ? 1 : credit / counted };
}

const bare = (text: string) => text.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");

/** The single most useful correction, or null when every word was fine. */
function chooseTip(words: ShadowWord[]): ShadowResult["tip"] {
  const candidates = words.filter((w) => w.status !== "ok" && !w.lenient);
  if (candidates.length === 0) return null;
  const kindOf = (w: ShadowWord): TipKind => {
    const word = bare(w.text).toLowerCase();
    if (w.status === "ending") return "ending";
    if (word.includes("th")) return "th";
    // A near miss on a word ending in a consonant sound is most often a dropped
    // final sound ("like" → "lie"). A silent final "e" does not count.
    if (w.status === "close" && /[bcdfgkpstvxz]$/.test(word.replace(/(?<=[^aeiou])e$/, ""))) return "ending";
    return "word";
  };
  const rank: Record<TipKind, number> = { ending: 0, th: 1, word: 2 };
  // Prefer the typical problems (CONTEXT.md 5), then longer, content-carrying words.
  const best = [...candidates].sort(
    (a, b) => rank[kindOf(a)] - rank[kindOf(b)] || bare(b.text).length - bare(a.text).length,
  )[0];
  return { kind: kindOf(best), word: bare(best.text) };
}

/**
 * Check one attempt. `alternatives` are the recognizer's guesses (best first);
 * the most generous one is used, since recognizers often rank badly. `names`
 * (character names) are never held against the learner.
 */
export function checkShadow(line: string, alternatives: string[], names: string[] = []): ShadowResult {
  const words = targetWords(line, names);
  const heardAny = alternatives.map((a) => a.trim()).filter(Boolean);
  if (heardAny.length === 0) {
    return {
      tier: "silent",
      score: 0,
      words: words.map((w) => ({ text: w.text, status: "missed", lenient: w.lenient })),
      tip: null,
      heard: "",
    };
  }
  const best = heardAny
    .map((heard) => ({ heard, ...judge(words, heard) }))
    .reduce((a, b) => (b.score > a.score ? b : a));
  const tier = best.score >= GREAT ? "great" : best.score >= GOOD ? "good" : "retry";
  return { tier, score: best.score, words: best.words, tip: chooseTip(best.words), heard: best.heard };
}
