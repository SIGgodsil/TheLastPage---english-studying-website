// Pure helpers for The Last Page: counting words, spotting word-bank words
// (in any common form) and inserting sentence starters at the cursor.

/** Word-count goal for an A2 ending, and the optional B1 challenge. */
export const ENDING_TARGET = { min: 50, max: 80, challenge: 100 } as const;

/** The words of a text, lowercased, without punctuation or a possessive 's. */
export function tokens(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g)
      ?.map((t) => t.replace(/'s$/, "")) ?? []
  );
}

/** Number of words in a text, as a learner would count them. */
export function wordCount(text: string): number {
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

/** Irregular forms of word-bank words that the regular rules below miss. */
const IRREGULAR: Record<string, string[]> = {
  forgive: ["forgave", "forgiven"],
  forget: ["forgot", "forgotten"],
  throw: ["threw", "thrown"],
  fight: ["fought"],
  burn: ["burnt"],
  wife: ["wives"],
  bet: ["bet"],
  drown: ["drowned"],
  remember: ["remembered"],
};

const VOWEL = /[aeiou]/;

/** Common forms of a single word: plural, -ed, -ing, -er, plus irregular ones. */
export function wordForms(word: string): Set<string> {
  const w = word.toLowerCase();
  const forms = new Set([w, `${w}s`, `${w}es`, `${w}ed`, `${w}ing`, `${w}er`, `${w}ers`, ...(IRREGULAR[w] ?? [])]);
  if (w.endsWith("e")) {
    const stem = w.slice(0, -1);
    forms.add(`${w}d`).add(`${stem}ing`).add(`${w}r`);
  }
  if (/[^aeiou]y$/.test(w)) {
    const stem = w.slice(0, -1);
    forms.add(`${stem}ies`).add(`${stem}ied`);
  }
  // Short words ending consonant-vowel-consonant double the last letter: drop → dropped.
  const last = w.at(-1) ?? "";
  if (w.length <= 4 && /[^aeiouwxy]/.test(last) && VOWEL.test(w.at(-2) ?? "") && !VOWEL.test(w.at(-3) ?? "a")) {
    forms.add(`${w}${last}ed`).add(`${w}${last}ing`).add(`${w}${last}er`);
  }
  return forms;
}

/** The word-bank entries (by `word`) that appear in the text in any common form. */
export function usedWords(text: string, bank: readonly string[]): Set<string> {
  const words = tokens(text);
  const present = new Set(words);
  const used = new Set<string>();
  for (const entry of bank) {
    const parts = entry.toLowerCase().split(/\s+/);
    if (parts.length === 1) {
      for (const form of wordForms(parts[0])) {
        if (present.has(form)) {
          used.add(entry);
          break;
        }
      }
      continue;
    }
    // A phrase ("kapok tree"): its words in a row, the last one in any form.
    const head = parts.slice(0, -1);
    const lastForms = wordForms(parts.at(-1)!);
    for (let i = 0; i + parts.length <= words.length; i++) {
      if (head.every((p, j) => words[i + j] === p) && lastForms.has(words[i + head.length])) {
        used.add(entry);
        break;
      }
    }
  }
  return used;
}

export type Insertion = { text: string; cursor: number };

/**
 * Insert a snippet at the selection. If the snippet contains "…", the text
 * before it is inserted, the text after it follows the cursor, and the "…"
 * itself is dropped ("said, “…”" leaves the cursor between the quotes).
 * A space is added when the snippet would touch the previous word.
 */
export function insertSnippet(text: string, start: number, end: number, snippet: string): Insertion {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const gap = /\S$/.test(before) && !/^[\s,.!?;:”’)]/.test(snippet) ? " " : "";
  const mark = snippet.indexOf("…");
  const head = mark === -1 ? snippet : snippet.slice(0, mark);
  const tail = mark === -1 ? "" : snippet.slice(mark + 1);
  // Starters end with "…": leave a space so the learner can type on.
  const lead = mark !== -1 && !tail && !/\s$/.test(head) && !/[“‘"']$/.test(head) ? " " : "";
  const trailingSpace = mark === -1 && /^[\p{L}\p{N}“‘"(]/u.test(after) ? " " : "";
  const inserted = gap + head + lead;
  return {
    text: before + inserted + tail + trailingSpace + after,
    cursor: before.length + inserted.length,
  };
}
