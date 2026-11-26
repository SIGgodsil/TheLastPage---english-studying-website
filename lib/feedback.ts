// Writing feedback for The Last Page: simple checks that run in the browser,
// plus suggestions from the free LanguageTool API (through /api/check),
// merged into one list the learner works through one at a time.

import { ENDING_TARGET, tokens, usedWords, wordCount } from "./ending.ts";

export type FixKind = "spelling" | "grammar" | "word" | "capital" | "punctuation" | "full-stop" | "spacing" | "repeat";

/** A problem at one place in the text, with replacements the learner can accept. */
export type Fix = {
  kind: FixKind;
  offset: number;
  length: number;
  /** The text at offset..offset+length when it was checked. */
  flagged: string;
  /** Best first; may be empty (then the learner fixes it by hand). */
  replacements: string[];
  /** LanguageTool's explanation, in English. */
  detail?: string;
  /** A few characters around the flagged text, to find it again after edits. */
  before: string;
  after: string;
};

const CONTEXT_CHARS = 12;

function around(text: string, offset: number, length: number): Pick<Fix, "before" | "after"> {
  return {
    before: text.slice(Math.max(0, offset - CONTEXT_CHARS), offset),
    after: text.slice(offset + length, offset + length + CONTEXT_CHARS),
  };
}

/** One LanguageTool match, as /api/check returns it. */
export type CheckMatch = {
  offset: number;
  length: number;
  message: string;
  replacements: string[];
  ruleId: string;
  category: string;
  issueType: string;
};

export type CheckResponse = { matches: CheckMatch[] };

/** Text sent for checking is cut to this many characters (LanguageTool's free limit is much higher). */
export const CHECK_MAX_CHARS = 5000;

const ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "st"]);

/** Checks that need no network: capital letters, "i", a repeated word, and the last full stop. */
export function localFixes(text: string): Fix[] {
  const fixes: Fix[] = [];
  const add = (kind: FixKind, offset: number, flagged: string, replacement: string) =>
    fixes.push({ kind, offset, length: flagged.length, flagged, replacements: [replacement], ...around(text, offset, flagged.length) });

  // A lowercase letter starting a sentence: at the start, after a new line, or after . ! ? and a space.
  // A closing quote in between ("Stop!” he said) is fine, so it is not matched.
  for (const m of text.matchAll(/(^|\n|[.!?]\s+)([“"‘]?)([a-z][\p{L}'’-]*)/gu)) {
    const before = text.slice(0, m.index + m[1].length).trimEnd();
    const prevWord = before.match(/([A-Za-z]+)\.$/)?.[1]?.toLowerCase();
    if (prevWord && ABBREVIATIONS.has(prevWord)) continue;
    const word = m[3];
    const offset = m.index + m[1].length + m[2].length;
    add("capital", offset, word, word[0].toUpperCase() + word.slice(1));
  }

  // The pronoun "i" (also in i'm, i'll, i've, i'd).
  for (const m of text.matchAll(/(?<![\p{L}'’])i(?=$|[^\p{L}])/gu)) {
    if (fixes.some((f) => f.offset === m.index)) continue;
    add("capital", m.index, "i", "I");
  }

  // The same word twice in a row ("the the").
  for (const m of text.matchAll(/\b([A-Za-z]+)(\s+)\1\b/gi)) {
    if (m[1].toLowerCase() === "had" || m[1].toLowerCase() === "that") continue; // "had had", "that that" can be right
    add("repeat", m.index, m[0], m[1]);
  }

  // No full stop (or ! ? …) at the very end.
  const trimmed = text.trimEnd();
  const last = trimmed.match(/([\p{L}\p{N}'’-]+)$/u);
  if (last && last.index !== undefined && wordCount(trimmed) > 0) {
    add("full-stop", last.index, last[1], `${last[1]}.`);
  }

  return fixes.sort((a, b) => a.offset - b.offset);
}

/** Which kind of fix a LanguageTool match is, or null for matches not worth showing an A2–B1 learner. */
function kindOf(match: CheckMatch): FixKind | null {
  if (/UPPERCASE|LOWERCASE/.test(match.ruleId)) return "capital"; // e.g. I_LOWERCASE is filed under TYPOS
  if (match.issueType === "duplication") return "repeat";
  switch (match.category) {
    case "TYPOS":
      return "spelling";
    case "GRAMMAR":
      return "grammar";
    case "CONFUSED_WORDS":
    case "COLLOCATIONS":
    case "NONSTANDARD_PHRASES":
      return "word";
    case "CASING":
      return "capital";
    case "PUNCTUATION":
      return "punctuation";
    case "TYPOGRAPHY":
      // Only the useful part: doubled or missing spaces. Not curly-quote or dash style.
      return /WHITESPACE|SPACE/.test(match.ruleId) ? "spacing" : null;
    default:
      return match.issueType === "misspelling" ? "spelling" : match.issueType === "grammar" ? "grammar" : null;
  }
}

/** A capitalised word in the middle of a sentence is a name (the learner may invent one). */
function looksLikeName(text: string, offset: number): boolean {
  if (!/^\p{Lu}/u.test(text.slice(offset))) return false;
  const before = text.slice(0, offset).trimEnd();
  return before !== "" && !/[.!?“"‘(\n]$/.test(before);
}

/**
 * True if the fix would change a name into another word, e.g. "say sorry to
 * Hung" → "to Hang" (LanguageTool reads the name as the verb "hung"). A name
 * is a capitalised word that is a known word (a character) or sits in the
 * middle of a sentence (one the learner invented).
 */
function rewritesName(text: string, offset: number, flagged: string, replacements: string[], known: Set<string>): boolean {
  for (const m of flagged.matchAll(/\p{Lu}[\p{L}'’-]*/gu)) {
    const name = m[0];
    if (name === "I" || name.startsWith("I'") || name.startsWith("I’")) continue; // the pronoun, not a name
    const isName = known.has(name.toLowerCase()) || looksLikeName(text, offset + m.index);
    if (!isName) continue;
    const keeps = (r: string) => new RegExp(`(^|[^\\p{L}])${name}($|[^\\p{L}])`, "u").test(r);
    if (replacements.length === 0 || !replacements.every(keeps)) return true;
  }
  return false;
}

/**
 * LanguageTool matches as fixes. Spelling flags on `knownWords` (character
 * names, the story's own words) are dropped: they are not mistakes here. No
 * fix may rewrite a name, whatever kind it is.
 */
export function languageToolFixes(text: string, matches: CheckMatch[], knownWords: string[] = []): Fix[] {
  const known = new Set(knownWords.flatMap((w) => tokens(w)));
  const fixes: Fix[] = [];
  for (const match of matches) {
    const kind = kindOf(match);
    if (!kind) continue;
    const flagged = text.slice(match.offset, match.offset + match.length);
    if (!flagged || match.offset < 0 || match.offset + match.length > text.length) continue;
    if (kind === "spelling" && (tokens(flagged).every((t) => known.has(t)) || looksLikeName(text, match.offset))) continue;
    if (kind !== "capital" && rewritesName(text, match.offset, flagged, match.replacements, known)) continue;
    fixes.push({
      kind,
      offset: match.offset,
      length: match.length,
      flagged,
      replacements: match.replacements.filter((r) => r !== flagged).slice(0, 3),
      detail: match.message,
      ...around(text, match.offset, match.length),
    });
  }
  return fixes;
}

/** Both lists in text order. Where two fixes overlap, the one from `first` wins. */
export function mergeFixes(first: Fix[], second: Fix[]): Fix[] {
  const overlaps = (a: Fix, b: Fix) =>
    a.offset < b.offset + Math.max(1, b.length) && b.offset < a.offset + Math.max(1, a.length);
  const kept = [...first];
  for (const fix of second) {
    if (!kept.some((k) => overlaps(k, fix))) kept.push(fix);
  }
  return kept.sort((a, b) => a.offset - b.offset);
}

/**
 * Where a fix's flagged text is now. The learner may have edited the text
 * since it was checked, so if it is no longer at `offset`, the nearest
 * occurrence with the same words before or after it is used. Null if it is
 * gone (already fixed by hand).
 */
export function locate(text: string, fix: Fix): number | null {
  const { flagged } = fix;
  if (!flagged) return null;
  // Whole words only: "befor" must not be found inside "before".
  const LETTER = /[\p{L}\p{N}]/u;
  const fits = (i: number) =>
    !(LETTER.test(flagged[0]) && LETTER.test(text[i - 1] ?? "")) &&
    !(LETTER.test(flagged.at(-1)!) && LETTER.test(text[i + flagged.length] ?? ""));
  if (text.slice(fix.offset, fix.offset + fix.length) === flagged && fits(fix.offset)) return fix.offset;
  let best: number | null = null;
  const sameContext = (i: number) =>
    (fix.before !== "" && text.slice(Math.max(0, i - fix.before.length), i) === fix.before) ||
    (fix.after !== "" && text.slice(i + flagged.length, i + flagged.length + fix.after.length) === fix.after);
  for (let i = text.indexOf(flagged); i !== -1; i = text.indexOf(flagged, i + 1)) {
    if (!fits(i) || !sameContext(i)) continue;
    if (best === null || Math.abs(i - fix.offset) < Math.abs(best - fix.offset)) best = i;
  }
  return best;
}

export type Applied = { text: string; offset: number; delta: number };

/** The text with one replacement made, or null if the flagged text is gone. */
export function applyFix(text: string, fix: Fix, replacement: string): Applied | null {
  const offset = locate(text, fix);
  if (offset === null) return null;
  return {
    text: text.slice(0, offset) + replacement + text.slice(offset + fix.length),
    offset,
    delta: replacement.length - fix.length,
  };
}

/** Move fixes after a change at `offset` by `delta` characters. */
export function shiftFixes(fixes: Fix[], offset: number, delta: number): Fix[] {
  return fixes.map((f) => (f.offset > offset ? { ...f, offset: f.offset + delta } : f));
}

/** True if the text uses the start of the story's sentence pattern ("If I had the last wish, I would…"). */
export function usesPattern(text: string, pattern: string): boolean {
  const head = tokens(pattern.split("…")[0]).slice(0, 4);
  if (head.length === 0) return false;
  const words = tokens(text);
  for (let i = 0; i + head.length <= words.length; i++) {
    if (head.every((w, j) => words[i + j] === w)) return true;
  }
  return false;
}

/** What went well, for the praise that opens the feedback. */
export type Strengths = {
  count: number;
  /** Word-bank words used, in bank order. */
  used: string[];
  pattern: boolean;
  challenge: boolean;
};

export function strengths(text: string, bank: string[], pattern: string): Strengths {
  const count = wordCount(text);
  const used = usedWords(text, bank);
  return {
    count,
    used: bank.filter((w) => used.has(w)),
    pattern: usesPattern(text, pattern),
    challenge: count >= ENDING_TARGET.challenge,
  };
}

/** Ask /api/check for LanguageTool's suggestions. Null if it could not be reached. */
export async function fetchLanguageCheck(text: string, timeoutMs = 12000): Promise<CheckMatch[] | null> {
  try {
    const response = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, CHECK_MAX_CHARS) }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<CheckResponse>;
    return Array.isArray(data.matches) ? data.matches : null;
  } catch {
    return null;
  }
}
