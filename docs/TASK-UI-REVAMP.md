# Task: UI revamp (professional, Times New Roman)

Asked for by the user on 2026-11-26, using the `web-design-studio` skill. **UI only:** no change to story logic, storage, speech or feedback code. The design rules live in `docs/DESIGN.md`.

Each phase runs the skill's loop: Build → Review (Mode C, `references/review-checklist.md`) → Verify (Mode D at 360 px and desktop) → `npm run lint` and `npm run build` → its own commit.

## Phases

- [x] **1. Foundation and home.**
  - Times New Roman for the whole app, with Tinos as the fallback; tokens and the `eyebrow`, `btn-primary` and `btn-secondary` utilities; focus, tap and reduced-motion rules.
  - Home: a masthead with a small dotted rule, the "continue" card as a rounded ink band, and the shelf as soft rounded story cards. Restyled the 404 page.
  - The user found the first pass too boxy (square corners, heavy double rule), so shapes were softened: pill buttons, rounded cards, a faint warm shadow.
- [x] **2. Chat screen.** Header, bubbles, narration, choices, typing indicator, "Dịch", page end.
  - Header: frosted paper bar with a round back button, the character in regular-weight type, "TRANG 1/4" as a wine eyebrow plus the page title in italics, and a thin progress line per page.
  - Bubbles: softer corners (1.25 rem), a faint shadow, 1.05 rem text; speaker names as eyebrows; the cliffhanger bubble gets a light wine wash.
  - Choices: each option a soft card with a "›" mark that lifts on hover; the hint is a light wine wash in italics, the prompt is italic.
  - "Tiếp" is an ink pill (`btn-ink`) so wine stays for decisions; the page end uses an eyebrow "HẾT TRANG 1/4", an italic teaser and `btn-primary`.
  - Review: added `scroll-padding-block` so the sticky header and footer never hide a focused word.
- [x] **3. Sheets.** Bottom sheet, word sheet, shadowing sheet.
  - Bottom sheet: 2 rem top corners, a soft warm shadow, a lightly blurred backdrop, `overscroll-contain`, and always left-aligned (it used to inherit centring from the page end). The close button is a round outlined chip.
  - Word sheet: "TỪ MỚI" eyebrow, the word large in wine, the IPA, then one soft card with "NGHĨA" and the English explanation, a wine-wash reminder for words met earlier, and an ink "Đã hiểu" pill.
  - Shadowing sheet: wine eyebrow, the line at 1.75 rem in regular weight, the Vietnamese in italics, outlined "Nghe" pills, a softer glow on the microphone, the result as a soft card, and `btn-primary`/`btn-secondary` for "Thử lại" and "Xong".
- [ ] **4. The Last Page and the shared page.** Prompt card, mood cards, starters, writer, word bank, feedback, done view, sharing, shared ending.

## Notes

- Mode D in the skill uses `playwright-cli`, which is not installed. Phase 1 was checked in the built-in browser pane instead (360 px and desktop, font resolved to Times New Roman, no horizontal overflow).
