// Tap-any-word: find the dictionary word (or short phrase) behind each word in
// a line. The server builds a small per-page table of forms (`pageWords`); the
// browser splits each line with the same rules (`wordSegments`).

import { englishTexts, type Dictionary, type Page } from "./schema.ts";
import { segments, type Glossary } from "./vocab.ts";

/** What a word sheet shows. `page` is set for story key words: where they were introduced. */
export type WordInfo = { vi: string; en?: string; ipa?: string; page?: number };

/** The words one page needs: surface form ("buries", "took care of") → key, and each key's entry. */
export type PageWords = { forms: Record<string, string>; entries: Record<string, WordInfo> };

export type WordSegment =
  | { kind: "text"; text: string }
  /** A story key word, marked [[…]] in the content: underlined. */
  | { kind: "word"; shown: string; key: string }
  /** Any other word found in the dictionary: tappable, not underlined. */
  | { kind: "lookup"; shown: string; key: string };

/** Longest phrase tried, in words. */
const MAX_PHRASE = 4;

/**
 * Regular forms of a word: -s/-es, -ed, -ing, -er/-est, with the usual spelling
 * changes. Some are not real words ("makeing"); they are harmless because a
 * form only matters when it appears in a story. For a phrase, the first word
 * changes ("take care of" → "takes care of").
 */
export function inflections(word: string): string[] {
  const [w, ...rest] = word.split(" ");
  const tail = rest.length > 0 ? ` ${rest.join(" ")}` : "";
  const out = new Set<string>();
  const add = (form: string) => out.add(form + tail);

  add(`${w}s`);
  add(`${w}ing`);
  if (/(s|x|z|ch|sh|o)$/.test(w)) add(`${w}es`);
  if (/[^aeiou]y$/.test(w)) {
    const stem = w.slice(0, -1);
    for (const end of ["ies", "ied", "ier", "iest"]) add(stem + end);
  }
  if (w.endsWith("e")) {
    for (const end of ["d", "r", "st"]) add(w + end);
    if (!w.endsWith("ee")) add(`${w.slice(0, -1)}ing`);
    if (w.endsWith("ie")) add(`${w.slice(0, -2)}ying`);
  } else {
    for (const end of ["ed", "er", "est"]) add(w + end);
  }
  // stop → stopped, sit → sitting, big → bigger
  if (/(^|[^aeiou])[aeiou][^aeiouwxy]$/.test(w)) {
    const doubled = w + w.at(-1);
    for (const end of ["ed", "ing", "er", "est"]) add(doubled + end);
  }
  return [...out];
}

/**
 * Every surface form in the dictionary → its key. Keys win over irregular
 * forms, which win over generated ones, so "later" stays "later" and is not
 * read as "late" + -r.
 */
export function formIndex(dict: Dictionary): Map<string, string> {
  const index = new Map<string, string>();
  const put = (form: string, key: string) => {
    if (!index.has(form)) index.set(form, key);
  };
  const keys = Object.keys(dict);
  for (const key of keys) put(key, key);

  const irregular = (key: string): string[] => {
    const own = dict[key].forms ?? [];
    const [head, ...rest] = key.split(" ");
    if (rest.length === 0) return own;
    // A phrase takes its first word's irregular forms: "run away" → "ran away".
    const tail = ` ${rest.join(" ")}`;
    return [...own, ...(dict[head]?.forms ?? []).map((f) => f + tail)];
  };
  for (const key of keys) for (const form of irregular(key)) put(form, key);
  for (const key of keys) for (const form of inflections(key)) put(form, key);
  return index;
}

/** Lookup candidates for one word token: as written, then without a possessive ending. */
function candidates(token: string): string[] {
  const t = token.toLowerCase().replace(/’/g, "'").replace(/^-+|-+$/g, "");
  const out = [t];
  if (t.endsWith("'s")) out.push(t.slice(0, -2));
  else if (t.endsWith("'")) out.push(t.slice(0, -1));
  return out;
}

const WORD = /[A-Za-z][A-Za-z'’-]*/g;

/** Split plain text (no [[marks]]) into text runs and dictionary words, longest phrase first. */
function splitRun(text: string, lookup: (form: string) => string | undefined): WordSegment[] {
  const tokens = [...text.matchAll(WORD)].map((m) => ({ text: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length }));
  const out: WordSegment[] = [];
  let last = 0;
  const push = (start: number, end: number, key: string) => {
    if (start > last) out.push({ kind: "text", text: text.slice(last, start) });
    out.push({ kind: "lookup", shown: text.slice(start, end), key });
    last = end;
  };

  for (let i = 0; i < tokens.length; i++) {
    let matched = false;
    // Phrases: words separated by single spaces only, so "run. Away" never matches.
    for (let n = Math.min(MAX_PHRASE, tokens.length - i); n >= 2 && !matched; n--) {
      const run = tokens.slice(i, i + n);
      if (run.some((t, j) => j > 0 && text.slice(run[j - 1].end, t.start) !== " ")) continue;
      const phrase = run.map((t) => t.text.toLowerCase().replace(/’/g, "'")).join(" ");
      const key = lookup(phrase);
      if (key) {
        push(run[0].start, run[n - 1].end, key);
        i += n - 1;
        matched = true;
      }
    }
    if (matched) continue;
    for (const form of candidates(tokens[i].text)) {
      const key = lookup(form);
      if (key) {
        push(tokens[i].start, tokens[i].end, key);
        break;
      }
    }
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Story text split into plain runs, marked key words and dictionary words. */
export function wordSegments(text: string, lookup: (form: string) => string | undefined): WordSegment[] {
  return segments(text).flatMap((s): WordSegment[] => (s.kind === "text" ? splitRun(s.text, lookup) : [s]));
}

/**
 * The forms and entries one page needs, so the browser never loads the whole
 * dictionary. A story key word met so far keeps its story entry (with IPA and
 * the page it was introduced on).
 */
export function pageWords(page: Page, dict: Dictionary, glossary: Glossary): PageWords {
  const index = formIndex(dict);
  const forms: Record<string, string> = {};
  const lookup = (form: string) => {
    const key = index.get(form);
    if (key) forms[form] = key;
    return key;
  };
  for (const node of page.nodes) for (const text of englishTexts(node)) wordSegments(text, lookup);

  const entries: Record<string, WordInfo> = {};
  for (const key of new Set(Object.values(forms))) {
    const story = glossary[key];
    const { vi, en, ipa } = story ?? dict[key];
    // No undefined fields: the entries are serialised into the page.
    entries[key] = { vi, ...(en && { en }), ...(ipa && { ipa }), ...(story && { page: story.page }) };
  }
  return { forms, entries };
}
