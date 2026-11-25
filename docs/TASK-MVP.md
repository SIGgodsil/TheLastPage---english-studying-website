# Task: MVP — chat, branching and tap-to-understand

Read `CLAUDE.md`, `docs/PRODUCT.md` and `CONTEXT.md` first.

**Goal:** a learner opens the app and, within 60 seconds, is reading *The Monkey's Paw* as a chat: messages appear one by one, they pick replies that branch the story, tap marked words to see their meaning, and move from page to page. Progress survives a reload.

**Out of scope (later milestones):** shadowing with speech recognition, The Last Page writing screen, streaks, audio.

The MVP is built in **phases**. Each phase ends with `npm run lint` and `npm run build` passing and its own commit, so work can stop after any phase.

## Phases

- [x] **1. App skeleton.** Next.js (App Router, TypeScript strict), Tailwind, ESLint, `zod` installed in place. Fonts (Lora + Inter via `next/font`), design tokens (ivory, ink, wine), a placeholder home page in Vietnamese, sized for 360px.
- [ ] **2. Story engine in `lib/`.** Load and validate story JSON with `lib/schema.ts`. A pure engine (no React): play nodes in order, follow `next`, apply a choice, report when the page ends. Vocab lookup that merges `vocab` from earlier pages. `localStorage` progress helpers wrapped in try/catch.
- [ ] **3. Chat screen.** Route `/story/[storyId]/[page]`. Message bubbles with avatar emoji, centred italic `narration`, voice-note style for `voice: true`, a typing indicator, and a tap-to-continue rhythm. `shadow` nodes show as a normal bubble with a disabled 🎙️ ("sắp có").
- [ ] **4. Choices and tap-to-understand.** Choice buttons (the pick is sent as the learner's message), tiered hints (hint → Vietnamese of each option), and a `WordPopover` for `[[vocab]]` words (English definition, Vietnamese, IPA). Optional `vi` translation toggle on bubbles.
- [ ] **5. Page flow and home.** Cliffhanger → "Trang tiếp theo" screen; the last page of a story → placeholder for The Last Page. Home goes straight into the story (resume from saved progress). Check the full story on a 360px screen, then tick the MVP box in `docs/PRODUCT.md`.

## Open question

Whether the home screen lists all 10 stories (the engine is generic, so they would all play) or only *The Monkey's Paw*. Decide before phase 5.
