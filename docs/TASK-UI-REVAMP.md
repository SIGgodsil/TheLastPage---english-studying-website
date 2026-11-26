# Task: UI revamp (professional, Times New Roman)

Asked for by the user on 2026-11-26, using the `web-design-studio` skill. **UI only:** no change to story logic, storage, speech or feedback code. The design rules live in `docs/DESIGN.md`.

Each phase runs the skill's loop: Build → Review (Mode C, `references/review-checklist.md`) → Verify (Mode D at 360 px and desktop) → `npm run lint` and `npm run build` → its own commit.

## Phases

- [x] **1. Foundation and home.**
  - Times New Roman for the whole app, with Tinos as the fallback; tokens and the `eyebrow`, `btn-primary` and `btn-secondary` utilities; focus, tap and reduced-motion rules.
  - Home: a masthead with a small dotted rule, the "continue" card as a rounded ink band, and the shelf as soft rounded story cards. Restyled the 404 page.
  - The user found the first pass too boxy (square corners, heavy double rule), so shapes were softened: pill buttons, rounded cards, a faint warm shadow.
- [ ] **2. Chat screen.** Header, bubbles, narration, choices, typing indicator, "Dịch", page end.
- [ ] **3. Sheets.** Bottom sheet, word sheet, shadowing sheet.
- [ ] **4. The Last Page and the shared page.** Prompt card, mood cards, starters, writer, word bank, feedback, done view, sharing, shared ending.

## Notes

- Mode D in the skill uses `playwright-cli`, which is not installed. Phase 1 was checked in the built-in browser pane instead (360 px and desktop, font resolved to Times New Roman, no horizontal overflow).
