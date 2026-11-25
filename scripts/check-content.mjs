// Authoring checks for one story folder, on top of the zod schema.
// Usage: node scripts/check-content.mjs content/<story-id>
// Needs Node 22.18+ (imports the TypeScript schema directly).
// Errors break the rules in TASK-CONTENT-JSON.md; warnings are worth a look.

import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  PageSchema,
  LastPageSchema,
  vocabMarks,
  plainText,
  successors,
  englishTexts,
  VOCAB_MARK,
} from "../lib/schema.ts";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/check-content.mjs content/<story-id>");
  process.exit(2);
}
const storyId = basename(dir);
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const EMOJI = /\p{Extended_Pictographic}/u;
const words = (s) => plainText(s).replace(/\p{Extended_Pictographic}|️|‍/gu, "").match(/[A-Za-z0-9'’-]+/g) ?? [];
const sentences = (s) =>
  plainText(s)
    .split(/(?<=[.!?…]["”’]?|\p{Extended_Pictographic}️?)\s+/u)
    .map((x) => x.trim())
    .filter((x) => words(x).length > 0);

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

// ---------- Pages ----------
const storyVocab = new Map(); // key -> page number where defined
const pages = [];
for (let p = 1; existsSync(join(dir, `page-${p}.json`)); p++) {
  const where = `page-${p}`;
  const parsed = PageSchema.safeParse(readJson(join(dir, `page-${p}.json`)));
  if (!parsed.success) {
    for (const i of parsed.error.issues) err(where, `schema: ${i.path.join(".")} ${i.message}`);
    continue;
  }
  const page = parsed.data;
  pages.push(page);
  if (page.storyId !== storyId) err(where, `storyId "${page.storyId}" should be "${storyId}"`);
  if (page.page !== p) err(where, `page number ${page.page} should be ${p}`);

  const { nodes } = page;
  const byId = new Map(nodes.map((n, i) => [n.id, i]));

  // Counts
  const talk = nodes.filter((n) => n.type === "message" || n.type === "narration").length;
  if (talk < 12 || talk > 15) err(where, `${talk} message/narration nodes (need 12–15)`);
  const choices = nodes.filter((n) => n.type === "choice");
  if (choices.length < 1 || choices.length > 2) err(where, `${choices.length} choices (need 1–2)`);
  const shadows = nodes.filter((n) => n.type === "shadow");
  if (shadows.length !== 1) err(where, `${shadows.length} shadow nodes (need 1)`);
  for (const s of shadows) {
    const n = words(s.text).length;
    if (n < 4 || n > 9) err(where, `shadow "${plainText(s.text)}" has ${n} words (need 4–9)`);
  }

  // Choices: 2 options, both rejoin within 1–3 nodes
  const walk = (id, steps) => {
    const out = [];
    let i = byId.get(id);
    while (i !== undefined && out.length < steps) {
      out.push(nodes[i].id);
      const next = successors(nodes, i);
      if (next.length !== 1) break;
      i = byId.get(next[0]);
    }
    return out;
  };
  for (const c of choices) {
    if (c.options.length !== 2) err(where, `choice "${c.id}" has ${c.options.length} options (need 2)`);
    const [a, b] = c.options.map((o) => walk(o.next, 6));
    const rejoin = a?.find((id) => b?.includes(id));
    if (!rejoin) {
      err(where, `choice "${c.id}" branches never rejoin`);
    } else {
      const extra = Math.max(a.indexOf(rejoin), b.indexOf(rejoin));
      if (extra < 1 || extra > 3) err(where, `choice "${c.id}" rejoins after ${extra} branch nodes (need 1–3)`);
    }
  }

  // Path lengths (what one learner actually sees)
  const lengths = [];
  const paths = (i, count) => {
    const n = nodes[i];
    const c = count + (n.type === "message" || n.type === "narration" ? 1 : 0);
    const next = successors(nodes, i);
    if (next.length === 0) return lengths.push(c);
    for (const t of next) paths(byId.get(t), c);
  };
  paths(0, 0);
  page.pathTalk = [Math.min(...lengths), Math.max(...lengths)];

  // Vocabulary
  for (const key of Object.keys(page.vocab)) {
    if (storyVocab.has(key)) err(where, `vocab "${key}" is already defined on page ${storyVocab.get(key)}`);
    storyVocab.set(key, p);
  }
  const used = new Set();
  const newHere = new Set(Object.keys(page.vocab));
  let viCount = 0;
  nodes.forEach((n) => {
    const texts = englishTexts(n);
    const marked = texts.flatMap(vocabMarks);
    for (const m of marked) {
      if (!storyVocab.has(m.key)) err(where, `"${n.id}" marks [[${m.key}]] but it is not defined on this or an earlier page`);
      used.add(m.key);
    }
    // Unmarked occurrences of any known vocab word
    for (const t of texts) {
      const rest = t.replace(VOCAB_MARK, " ");
      for (const key of storyVocab.keys()) {
        const re = new RegExp(`\\b${key}(s|es|ed|d|ing)?\\b`, "i");
        if (re.test(rest)) err(where, `"${n.id}" has "${key}" without a [[mark]]: ${t}`);
      }
    }
    // vi on every message with a word introduced on this page
    const needsVi = marked.some((m) => newHere.has(m.key));
    if (n.type === "choice") {
      n.options.forEach((o, k) => {
        if (vocabMarks(o.text).some((m) => newHere.has(m.key)) && !o.vi)
          err(where, `"${n.id}" option ${k + 1} has a new word but no vi`);
      });
    } else if ("vi" in n || ["message", "narration", "cliffhanger"].includes(n.type)) {
      if (needsVi && !n.vi) err(where, `"${n.id}" has a new word but no vi`);
    }
    if ((n.type === "message" || n.type === "narration") && n.vi) viCount++;

    // Sentence length (A2: 6–10 words, 1–2 sentences per message)
    if (n.type === "message" || n.type === "narration") {
      const ss = sentences(n.text);
      if (ss.length > 2) warn(where, `"${n.id}" has ${ss.length} sentences: ${plainText(n.text)}`);
      for (const s of ss) if (words(s).length > 10) warn(where, `"${n.id}" sentence over 10 words: ${s}`);
    }
    if (n.type === "narration" && EMOJI.test(n.text)) err(where, `narration "${n.id}" must not use emoji`);
  });
  for (const key of newHere) if (!used.has(key)) err(where, `vocab "${key}" is defined but never used on this page`);
  page.vocabUsed = [...used];
  page.viRatio = `${viCount}/${talk}`;
  if (viCount / talk < 0.3) warn(where, `only ${viCount}/${talk} messages have vi (aim for about 1 in 3)`);
}
if (pages.length !== 4) err(storyId, `found ${pages.length} pages (need 4)`);

// ---------- Last page ----------
const lpFile = join(dir, "last-page.json");
if (!existsSync(lpFile)) err("last-page", "missing");
else {
  const parsed = LastPageSchema.safeParse(readJson(lpFile));
  if (!parsed.success) for (const i of parsed.error.issues) err("last-page", `schema: ${i.path.join(".")} ${i.message}`);
  else {
    const lp = parsed.data;
    if (lp.storyId !== storyId) err("last-page", `storyId "${lp.storyId}" should be "${storyId}"`);
    const bank = lp.wordBank.map((w) => w.word.toLowerCase());
    for (const key of storyVocab.keys()) if (!bank.includes(key)) err("last-page", `wordBank is missing "${key}"`);
    const [a2, b1] = lp.modelEndings.map((e) => words(e.text).length);
    if (a2 < 60 || a2 > 80) err("last-page", `A2 ending has ${a2} words (need 60–80)`);
    if (b1 < 100 || b1 > 130) err("last-page", `B1 ending has ${b1} words (need 100–130)`);
    lp.counts = { a2, b1 };
    pages.lastPage = lp;
  }
}
if (storyVocab.size !== 10) err(storyId, `${storyVocab.size} vocab words defined (need 10)`);

// ---------- Report ----------
console.log(`\n${storyId}`);
for (const p of pages) {
  const c = (t) => p.nodes.filter((n) => n.type === t).length;
  console.log(
    `  page-${p.page}  talk ${c("message") + c("narration")} (path ${p.pathTalk.join("–")})  choice ${c("choice")}  shadow ${c("shadow")}  vi ${p.viRatio}  new vocab: ${Object.keys(p.vocab).join(", ") || "—"}`,
  );
}
if (pages.lastPage) console.log(`  last-page  endings A2 ${pages.lastPage.counts.a2} words, B1 ${pages.lastPage.counts.b1} words`);
const ipaCheck = pages.flatMap((p) => Object.entries(p.vocab).filter(([, v]) => v.ipaCheck).map(([k, v]) => `${k} ${v.ipa}`));
if (ipaCheck.length) console.log(`  ipaCheck: ${ipaCheck.join(", ")}`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
console.log(errors.length ? `\n${errors.length} error(s)` : "\nOK");
process.exit(errors.length ? 1 : 0);
