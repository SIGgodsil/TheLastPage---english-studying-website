// Checks that every word in the stories can be tapped: it is in
// content/dictionary.json (directly or as a form), a basic word, or a name.
// Usage: node scripts/check-dictionary.mjs
// Needs Node 22.18+ (imports the TypeScript sources directly).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DictionarySchema, PageSchema, englishTexts } from "../lib/schema.ts";
import { formIndex, wordSegments } from "../lib/dictionary.ts";

/** Words every A2 learner knows. They are left plain (not tappable). */
const BASIC = new Set(
  `a an the i me my mine you your yours he him his she her hers it its we us our they them their
  this that these those is am are was were be been being do does did doing have has had having
  can could would i'm you're he's she's it's we're they're that's there's what's who's
  and or but to of in on at for from with up down out not no yes very
  oh hey hello hi ha haha ah wow
  one two three four five six seven eight nine ten
  what who where when why how which`.split(/\s+/),
);

/** Names that are not characters in any page (people and places mentioned in the text). */
const NAMES = new Set(
  `hung dan lan khanh nhi lang phan tu van hoang giang tan vien nam xuong vu nuong truong sinh
  ngo ngoc tam nhan diep brisbane kamtschatka katrina ichabod brom bluebeard anna anne jack lester
  herbert morris meagar whites`.split(/\s+/),
);

const dict = DictionarySchema.parse(JSON.parse(readFileSync("content/dictionary.json", "utf8")));
const index = formIndex(dict);
const lookup = (form) => index.get(form);
const missing = new Map(); // word -> first place seen

for (const story of readdirSync("content")) {
  const dir = join("content", story);
  if (!statSync(dir).isDirectory()) continue;
  for (let p = 1; existsSync(join(dir, `page-${p}.json`)); p++) {
    const page = PageSchema.parse(JSON.parse(readFileSync(join(dir, `page-${p}.json`), "utf8")));
    const names = new Set(Object.values(page.characters).flatMap((c) => c.name.toLowerCase().split(/[\s-]+/)));
    for (const node of page.nodes) {
      for (const text of englishTexts(node)) {
        for (const seg of wordSegments(text, lookup)) {
          if (seg.kind === "word" && !dict[seg.key]) missing.set(seg.key, `${story} p${p} (key word not in dictionary)`);
          if (seg.kind !== "text") continue;
          for (const m of seg.text.matchAll(/[A-Za-z][A-Za-z'’-]*/g)) {
            const w = m[0].toLowerCase().replace(/’/g, "'").replace(/'s?$/, "");
            if (BASIC.has(m[0].toLowerCase().replace(/’/g, "'")) || BASIC.has(w) || NAMES.has(w) || names.has(w)) continue;
            if (!missing.has(w)) missing.set(w, `${story} p${p}: ${text.slice(0, 60)}`);
          }
        }
      }
    }
  }
}

if (missing.size > 0) {
  console.error(`${missing.size} word(s) cannot be tapped:`);
  for (const [w, where] of [...missing].sort()) console.error(`  ${w}  (${where})`);
  process.exit(1);
}
console.log(`OK: every word can be tapped (${Object.keys(dict).length} dictionary entries).`);
