# Task: Convert the story scripts into app JSON

Read `CLAUDE.md`, `docs/PRODUCT.md` and `docs/CONTEXT.md` first.

**Input:** `content-drafts/ghost-stories-a2.md`. It holds 10 A2 ghost stories written as prose. Each story has 4 pages, a "The Last Page" prompt, a "Kết gốc" note (the original ending, for writers only) and a "Từ vựng chính" list of 10 words.

**Output:** chat-format JSON files the app can play, following the schema in `docs/PRODUCT.md` section 6.

## Files to produce

```
content/
├── stories.json                 # manifest for the learning-path map
└── <story-id>/
    ├── page-1.json … page-4.json
    └── last-page.json
```

Story ids (kebab-case, in this order):
`monkeys-paw`, `nam-xuong`, `upper-berth`, `ma-da`, `sleepy-hollow`, `kapok-tree`, `bluebeard`, `mosquito`, `toll-house`, `temple-judge`

### `stories.json`

For each story: `id`, `title`, `titleVi`, `pair` (1–5), `themeVi`, `origin` ("vn" or "west"), `source` (author and year), `fearLevel` (1–3), `level` ("A2"), `pages` (4) and `order`.

## How to turn prose into chat

### The learner's role
The learner is a **close friend of the main character** and is part of the conversation. Characters **text the learner**. Where the original setting is historical, keep the setting but treat the chat as letters, voice messages or a "story friend" talking to the learner. Never break the plot.

| Story | Learner is… | Main texter(s) |
|---|---|---|
| monkeys-paw | Herbert's best friend (modern retelling) | Herbert, later Mrs. White |
| nam-xuong | Vu Nuong's close friend in the village | Vu Nuong, later Truong Sinh |
| upper-berth | Brisbane's friend on land | Brisbane |
| ma-da | Nam's best friend | Nam, Grandma |
| sleepy-hollow | Ichabod's friend in town | Ichabod |
| kapok-tree | Ngo's friend | Ngo, later the villagers |
| bluebeard | Anna's friend | Anna, Sister Anne |
| mosquito | Ngoc Tam's friend | Ngoc Tam |
| toll-house | the fifth friend, who stayed home | Jack, Lester, White, Meagar (group chat) |
| temple-judge | Van's friend | Van, the Earth God |

### Node types
Use the types in PRODUCT.md (`message`, `choice`, `shadow`, `free-reply`, `cliffhanger`) and **add one new type**, `narration`: a short, italic scene line shown between messages (for example *"Midnight. The candle goes out."*). Add it to the zod schema in `lib/schema.ts`, render it in the chat UI as a centred, italic, muted line, and document it in PRODUCT.md section 6.

### Each page must have
- **12–15** `message` or `narration` nodes in total
- **1–2** `choice` nodes with 2 options each. Both branches **rejoin** the main plot within 1–3 nodes. No branch is punished.
- **1** `shadow` node: a short, memorable line of 4–9 words taken from the page
- Exactly **1** `cliffhanger` node at the end, matching the last line of that page in the script
- Every `choice` has a Vietnamese `prompt` and a `hint`

### Language rules (A2)
- **Keep the plot and the English of the script.** You may split long sentences into several messages, turn narration into a character's message, and add short reactions (*"No way!"*, *"I'm scared 😨"*).
- Each message: 1–2 sentences, 6–10 words each, mostly present simple and past simple.
- Do not add new vocabulary above A2. Do not copy text from the original works or from modern translations.
- Emoji: use the characters' styles from CONTEXT.md section 6. Narrators and serious characters (Morris, the King, the priest) use none.
- Horror is suggested, never graphic.

### Vocabulary
- Use the story's 10 words from "Từ vựng chính". Put each one in the `vocab` of the page where it first appears, and mark **every** occurrence in that page's text with `[[word]]` or `[[shown form|key]]`.
- Each vocab entry: `en` (a simple English definition, max 10 words), `vi` (natural Vietnamese) and `ipa` (standard American IPA, e.g. `/wɪʃ/`).
- A word used again on a later page is marked again there too; its definition can live only on the first page.
- If you are not sure about an IPA transcription, add `"ipaCheck": true` so a human can verify it.

### Vietnamese translations
Add `vi` to about 1 in 3 messages: the key plot moments and every message that contains a new vocab word. Write natural Vietnamese, not word-for-word.

### `last-page.json`
- `promptVi`: the question from the script's "The Last Page" section
- `pattern`: the sentence pattern from the script (e.g. `"If I had the last wish, I would wish…"`)
- `moods`: `["happy", "sad", "twist"]`, each with a one-line `hintVi`
- `starters`: 6 A2 sentence starters
- `wordBank`: the story's 10 words plus up to 5 useful extras
- `modelEndings`: 2 **new** endings, one A2 (60–80 words) and one B1 (100–130 words). Do not copy the original ending.
- `authorNote`: the "Kết gốc" text from the script (never shown to learners)

## How to work

1. **Do `monkeys-paw` only first.** Then validate it with the zod schema, play it in the app to check it renders, and show me:
   - a short summary of the four pages
   - the choices
   - the shadow lines
   - anything you were unsure about

   Wait for my OK.
2. After my OK, do the other 9 stories in the order above. Commit after each story: `Add <story-id> content`.
3. At the end, write `stories.json`, run `npm run lint` and `npm run build`, and list every vocab entry marked `ipaCheck` so I can review them.
