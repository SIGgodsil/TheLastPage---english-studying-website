# Task: The Last Page (write an ending, get feedback, share it)

Read `CLAUDE.md`, `docs/PRODUCT.md` (section 6.5, `last-page.json`) and `CONTEXT.md` (sections 2 and 7) first.

**Goal:** after the last chat page, the learner writes a new ending for the story, gets kind feedback (praise first, then **one** correction at a time), revises it, and can share it by link. This is the goal the whole story leads to: every word learned is a tool for the ending.

**Constraints:**
- Zero cost, client-side first. The only server code is `app/api/check/route.ts`, a thin proxy to the free public LanguageTool API. If it fails, feedback still works with the local checks.
- No accounts and no storage on a server. The draft and the finished ending live in `localStorage`. A shared ending travels inside the link itself (`lz-string` compression, as decided in `CONTEXT.md`; a small dependency of about 5 KB).
- `authorNote` (the original ending) is never sent to the browser.
- UI text in Vietnamese, story text in English. Mobile-first at 360px.

Built in **phases**, each ending with `npm run lint` and `npm run build` passing and its own commit. Branch: `feat/last-page` (cut from `feat/shadowing`).

## Phases

- [x] **1. Writing screen.** Replace the placeholder at `/story/<id>/last-page`. The screen shows:
  - the question (`promptVi`) and the sentence pattern;
  - three mood cards (có hậu / buồn / bất ngờ), each showing its `hintVi` when picked;
  - starter chips that insert a sentence start at the cursor (the `…` becomes the cursor);
  - the text box, with a word counter (target 50–80 words, optional B1 challenge at 100+);
  - the story's word bank, with a mark on each word already used (inflected forms count: *escaped*, *footsteps*, *forgave*), and tap-to-see the Vietnamese meaning and insert the word.

  The draft (mood + text) is saved to `localStorage` as the learner types and restored on return. Pure helpers live in `lib/ending.ts`.
  - **Done:**
    - `lib/ending.ts` (`wordCount`, `usedWords`, `insertSnippet`), `saveEnding()` in `lib/storage.ts`, and `components/LastPageWriter.tsx` + `components/EndingParts.tsx`.
    - The draft saves 0.4 s after typing stops and when the page is left; other progress is kept.
    - Tested: word forms and phrases on all 10 word banks, insertion cases, storage, and the screen at 360px (mood, starters, quote cursor, word bank, counter, B1 challenge, reload restores the draft). `authorNote` is not in the build output.
- [x] **2. Feedback.**
  - `lib/ending.ts` adds local checks: length, words from the bank used, the pattern used, and simple capital-letter and full-stop checks.
  - `app/api/check/route.ts` proxies to LanguageTool (`en-US`), with a size limit and a timeout.
  - The feedback panel opens with praise ("Đoạn kết rất sáng tạo! Bạn đã dùng 4 từ mới."), then shows **one** suggestion at a time, with "Sửa giúp mình" (apply the replacement) or "Bỏ qua", and the learner keeps revising.
  - If the network or LanguageTool fails, a gentle note is shown and only the local feedback appears.
  - Text is sent to LanguageTool (languagetool.org) only when the learner asks for feedback, and the screen says so.
  - **Done:**
    - `lib/feedback.ts`: local checks (sentence capitals, "i", repeated word, final full stop), LanguageTool matches mapped to kinds, merging, and applying a fix even after the learner has edited. A moved fix is found again by its context, and only as a whole word.
    - `app/api/check/route.ts`: same-origin only, 5,000-character limit, 8 s timeout, zod-checked answer.
    - `components/EndingFeedback.tsx` and `components/endingCopy.tsx`: up to 6 fixes, then gentle notes (write more, use the word bank, try the pattern, with "Chèn mẫu câu").
    - Spelling flags on character names, word-bank words and mid-sentence capitalised words (invented names) are dropped; style and curly-quote rules are not shown.
    - Tested:
      - logic, including a real LanguageTool answer and 12 model endings: no false alarms, except one fair comma suggestion;
      - the route: OK, wrong origin 403, empty, bad and too-long requests 400, GET 405;
      - the screen at 360px: a full pass through 8 suggestions, offline fallback, a fix made by hand, and the too-short state.
    - The free API misses some grammar (it caught *eyes was* in one run but not *It were*), so feedback stays gentle and never claims a text is error-free beyond "Mình không thấy lỗi nào cả!".
- [ ] **3. Finish and share.**
  - "Hoàn thành" saves the ending and marks the story finished on the home shelf.
  - The two model endings (A2, B1) are shown to compare.
  - A share link carries the story id, mood and text, compressed into the URL fragment (it is not sent to the server).
  - A read-only page shows a shared ending as a card, with a button to read the story.
  - Uses the Web Share API, with "Sao chép liên kết" as the fallback.
  - Tick the roadmap box in `docs/PRODUCT.md`.

## Notes

