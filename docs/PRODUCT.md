# Product — The Last Page

> Sections 1–5 and 7 are short stubs taken from `README.md`; expand them when the MVP is planned. Section 6 (content format) is complete and matches `lib/schema.ts`.

## 1. Summary

A free web app for Vietnamese learners of English at A2–B1. Classic public-domain stories are retold as chat messages. The learner is a friend of the main character, makes branching choices, shadows key lines and finally rewrites the ending on **The Last Page**.

## 2. Users

Vietnamese university students and young working adults, CEFR A2–B1, phone-first, about 5 minutes a session. See `CONTEXT.md` section 5.

## 3. Features

Chat-based stories · branching choices (never punished) · tap a word for its meaning · shadowing with in-browser speech recognition · The Last Page (write, get feedback, share by link) · progress in `localStorage`.

## 4. Learning flow

Learning-path map → Page 1 … Page 4 (each ends on a cliffhanger) → The Last Page.

## 5. Screens

To be written.

## 6. Content format

Story content is static JSON under `content/`, validated with zod (`lib/schema.ts`) when it loads. Authors can run extra checks with `node scripts/check-content.mjs content/<story-id>`.

```
content/
├── stories.json            # manifest for the learning-path map
└── <story-id>/
    ├── page-1.json … page-4.json
    └── last-page.json
```

### 6.1 `stories.json`

An array, one entry per story:

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case, same as the folder name |
| `title`, `titleVi` | string | English and Vietnamese titles |
| `pair` | 1–5 | stories come in themed pairs (one Western, one Vietnamese) |
| `themeVi` | string | theme of the pair, e.g. "Người chết trở về" |
| `origin` | `"vn"` \| `"west"` | |
| `source` | string | author and year, e.g. "W. W. Jacobs, 1902" |
| `fearLevel` | 1–3 | |
| `level` | `"A2"` \| `"B1"` | |
| `pages` | number | number of chat pages (not counting the Last Page) |
| `order` | number | position on the map |

### 6.2 Page files (`page-N.json`)

```jsonc
{
  "storyId": "monkeys-paw",
  "page": 1,
  "title": "A Visitor in the Rain",
  "titleVi": "Vị khách trong mưa",
  "level": "A2",
  "chatTitle": "Herbert",                       // chat header: a person or a group
  "characters": {                               // everyone who speaks on this page
    "herbert": { "name": "Herbert", "emoji": "😄" }
  },
  "vocab": {                                    // words FIRST introduced on this page
    "wish": { "en": "something you want very much to happen", "vi": "điều ước", "ipa": "/wɪʃ/" }
  },
  "nodes": [ /* see 6.3 */ ]
}
```

- Character ids are camelCase (`mrsWhite`). The learner is never a character: the learner's lines come from `choice` options.
- **Vocab entries:** `en` (simple definition, max 10 words), `vi` (natural Vietnamese), `ipa` (American IPA between slashes, Cambridge US style: `/e/` in *spell*, `ː` for long vowels, `/ɚ/` for unstressed *-er* as in *river* `/ˈrɪvɚ/`, `/ɝː/` for stressed *er* as in *burn* `/bɝːn/`). Add `"ipaCheck": true` when a human should verify the IPA.
- A word is defined only on the page where it first appears. Later pages still mark it; the app looks the definition up from earlier pages.

### 6.3 Nodes

Nodes play **in array order**, starting at `nodes[0]`. A node with `next` jumps to that id instead; branches use this to skip the other branch and rejoin the main plot. Every page ends with exactly one `cliffhanger`, every node must be reachable, and there are no loops.

| Type | Fields | Shown as |
|---|---|---|
| `message` | `from`, `text`, `vi?`, `voice?`, `next?` | a chat bubble from a character. `voice: true` shows it as a voice note with its transcript (e.g. Herbert records Morris) |
| `narration` | `text`, `vi?`, `next?` | a short scene line between messages, **centred, italic and muted**, with no bubble or avatar. Never uses emoji. Example: *Midnight. The candle goes out.* |
| `choice` | `prompt` (vi), `hint` (vi), `options[]` (`text`, `vi?`, `next`) | 2–3 reply buttons. The chosen option is sent as the learner's own message. Wrong choices are never punished: every option leads on and the branches rejoin within 1–3 nodes |
| `shadow` | `from`, `text`, `vi`, `voice?`, `next?` | the character's line as a bubble, plus a 🎙️ button to repeat it aloud. 4–9 words |
| `free-reply` | `prompt` (vi), `hint` (vi), `sample`, `level?`, `next?` | an optional (B1) typed reply, with `sample` as the last hint tier |
| `cliffhanger` | `from?`, `text`, `vi?`, `voice?` | the page's last line. With `from` it is a bubble; without it, a narration-style line. Followed by the "next page" screen |

### 6.4 Text markup

- **Vocabulary:** mark every occurrence of a vocab word with `[[word]]`, or `[[shown form|key]]` when the shown form differs from the key (`[[knocked|knock]]`, `[[Wishes|wish]]`). A bare `[[Word]]` uses the lowercased word as its key. Vietnamese text never contains marks.
- **Translations:** `vi` on about 1 in 3 messages: key plot moments and every message (or choice option) that contains a word introduced on that page.

### 6.5 `last-page.json`

| Field | Notes |
|---|---|
| `storyId` | |
| `promptVi` | the writing question, in Vietnamese |
| `pattern` | sentence pattern to reuse, e.g. "If I had the last wish, I would wish…" |
| `moods` | exactly three: `{ "id": "happy" \| "sad" \| "twist", "hintVi": "…" }` |
| `starters` | 6 A2 sentence starters |
| `wordBank` | `{ "word", "vi" }`: the story's 10 vocab words, then up to 5 extras |
| `modelEndings` | two **new** endings: `{ "level": "A2", "text" }` (60–80 words), then `{ "level": "B1", "text" }` (100–130 words) |
| `authorNote` | the original ending, for writers only. **Never shown to learners** |

### 6.6 Writing rules (summary)

Per page: 12–15 `message` + `narration` nodes in total, 1–2 `choice` nodes with 2 options each, 1 `shadow`, 1 `cliffhanger` at the end. Messages are 1–2 sentences of 6–10 words, mostly present and past simple. Horror is suggested, never graphic. Full style guide: `CONTEXT.md` section 6.

## 7. Roadmap

- [x] **MVP:** *The Monkey's Paw* with chat, branching and tap-to-understand (all 10 stories play; see `docs/TASK-MVP.md`)
- [ ] Shadowing with pronunciation feedback via the Web Speech API
- [ ] **The Last Page** screen: write an ending, get feedback, share it by link
- [ ] Daily streaks and in-app waiting messages
- [x] Content: 10 A2 ghost stories converted to chat JSON, plus `content/stories.json`
- [ ] Community page to read and vote on endings
