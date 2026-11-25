# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**The Last Page** is a free web app for Vietnamese learners of English at **A2–B1** level. Classic public-domain stories are retold as **chat messages**. The learner plays a character, makes **branching choices**, practises speaking by **shadowing** lines, and finally **rewrites the ending** ("The Last Page").

Before starting any feature, read:
- `docs/PRODUCT.md`: what to build (features, content format, roadmap)
- `docs/CONTEXT.md`: why it is built this way (decisions, research, persona, writing style)

## Hard constraints (never break these)

- **Zero cost.** No paid APIs, no paid services, no database, no auth provider. It must run on the Vercel **Hobby** (free) plan.
- **No push notifications, no payments, no ads, no sign-up.**
- **Client-side first.** All logic runs in the browser. The only server code allowed is `app/api/check/route.ts`, a thin proxy to the free public LanguageTool API.
- **Progress lives in `localStorage`.** Wrap every read and write in try/catch, because storage can be unavailable.
- **Mobile-first.** Design for a 360px-wide screen first, then scale up.
- **Browser support:** Chrome, Edge and Safari. Speech features may degrade gracefully on Firefox: show a friendly message, never crash.

## Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- `zod` to validate story JSON at load time
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for shadowing
- Pre-generated mp3 audio in `public/audio/`, made offline with open-source TTS
- Do not add other dependencies unless clearly necessary. Ask first if a new dependency is large.

## Folder layout

```
app/                    # routes and UI
  api/check/route.ts    # LanguageTool proxy (only server code)
components/             # reusable UI (ChatBubble, ChoiceButtons, WordPopover, …)
lib/                    # story engine, storage, speech, text checks
content/<story-id>/     # page-1.json … page-N.json, last-page.json
public/audio/<story-id>/
docs/PRODUCT.md         # product spec and roadmap
```

## Language rules

- **Story text:** English, at the CEFR level set in each page's JSON.
- **UI text** (buttons, hints, instructions, feedback): **Vietnamese**.
- **Code, comments, commit messages:** English.

## Design tokens

- Background (paper ivory): `#F7F3EA`
- Text (ink): `#2B2420`
- Accent (wine red): `#8B2E2E`
- Headings: Playfair Display or Lora (serif). Chat and UI: Inter (sans-serif). Load fonts with `next/font`.
- Tone: calm, literary, warm. No harsh red error states: mistakes are shown kindly.

## UX principles

1. Mistakes are never punished: no lives, no lock-outs. A "wrong" choice leads to another interesting branch.
2. Hints come in tiers: hint → translate key word → show answer.
3. Feedback praises first, then gives **one** correction at a time.
4. Every page ends on a cliffhanger.
5. The learner reaches the story within 60 seconds of opening the app.

## Working style

- Work **one milestone at a time** (see the roadmap in `docs/PRODUCT.md`). Propose a short plan before large changes.
- Keep components small and typed. Story logic stays in `lib/`, not inside components.
- Before saying a task is done, run `npm run lint` and `npm run build`, and fix any errors.
- After finishing a milestone, tick its checkbox in `docs/PRODUCT.md`.
- Commit messages: short and imperative, e.g. `Add branching choices to chat engine`.
- Never commit secrets or `.env*` files. The app should not need any secrets.
