# Task: reading help (more word meanings, every line translatable)

## Why

User test: learners gave up on pages 1–2 because there were too many words and
sentence patterns they did not understand.

What the content shows (all 40 pages):

- **260 of 795 lines (33%) have no Vietnamese translation**, so they have no
  "Dịch" button. These are often the hardest lines, the idioms: "Greetings, my
  friend!", "So do I!", "Lucky you.", "The bet is on!", "It smells of dust".
- **Only 100 words are tappable** (about 2.5 per page). Words like *famous,
  lost, rich, gate, buries, pointed, lonely, candles, dust, suddenly, pocket*
  cannot be looked up.
- Sentence patterns are never explained.
- The stories use 926 different word forms in total (roughly 450 words above
  beginner level once forms and very basic words are removed), so a dictionary
  for every word is a realistic size.

## Goal

A learner never meets a word or a sentence pattern they have no way to
understand. Help works at the level of **words and patterns, not whole-line
translations**: the existing "Dịch" button stays where it is, but no new
line translations are written. The help stays one tap away, so the chat still
reads like a chat.

## Plan

### Phase 1: look up any word

- [x] `content/dictionary.json`: every word in the stories above beginner level
      (plus common phrasal verbs and set phrases such as *take care of, run away,
      of course, laugh at*), with `vi` and the irregular forms it appears in
      (*lost → lose*). 652 entries; the 98 story key words are copied in with
      their English definition and IPA.
- [x] Context: instead of per-page overrides, `vi` lists the meaning used in
      the stories first and other senses after it (*left* sits under *leave*:
      "rời đi; để lại"). No word needed a page-specific meaning.
- [x] Every dictionary word in a line is tappable. Story key words keep their
      dotted underline ("Từ mới"); other words get no underline so the text
      stays calm.
- [x] The meaning shows **at once, right next to the word** (a small popover,
      not a bottom sheet), as the user asked: closes on ✕, Esc or a tap
      elsewhere, and follows the word if the chat scrolls.
- [x] Phrases match before single words (longest match first).
- [x] `scripts/check-dictionary.mjs`: every word form in the stories is either
      in the dictionary, a basic word or a name.
- [x] A one-time tip above the chat: "Không hiểu từ nào, bấm vào từ đó…". It
      hides once dismissed or once the learner opens a word. The intro's
      "Cách đọc" says the same.

Notes:
- Plain words are tappable spans, not buttons, so screen readers still read a
  line as one sentence. Keyboard users keep the key words (buttons) and "Dịch".
- Words inside choice buttons are not tappable (a button cannot hold
  buttons); they become tappable once sent, in the learner's bubble.

### Phase 2: explain sentence patterns

- [x] Optional `noteVi` on a message, narration, shadow or cliffhanger line:
      one short Vietnamese note on the pattern or idiom (*So do I! = Tôi cũng
      vậy, dùng để đồng ý với câu khẳng định*). It explains the pattern; it does
      not translate the whole line. English fragments go between asterisks
      (`*So do I!*`) and show in italics.
- [x] A small "Cấu trúc" button under the line (next to "Dịch" when there is
      one) shows the note inside the bubble.
- [x] Notes for pages 1–2 of every story (224 notes), where learners give up.
- [x] Notes for pages 3–4 (237 notes). In total 461 of 645 character and
      narration lines have a note; the rest are plain enough on their own.

### Phase 3: a friendlier word sheet and page start

- [ ] 🔊 button in the word sheet (browser speech synthesis, free; hidden when
      unsupported).
- [ ] The word sheet shows the line where the word appeared, with its
      translation.
- [ ] Before page 1 and 2 of each story: a short "Từ cần biết" card with the
      page's key words, so learners meet them before the chat starts
      (skippable).

## Out of scope

- Writing Vietnamese translations for the lines that have none (decided after
  the user test: learners need word meanings and patterns, not full lines).
- Rewriting the stories in easier English. If learners still struggle after
  these phases, simplify the hardest lines of pages 1–2 as a separate task.
