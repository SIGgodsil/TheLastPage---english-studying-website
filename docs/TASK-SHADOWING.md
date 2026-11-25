# Task: Shadowing with pronunciation feedback

Read `CLAUDE.md`, `docs/PRODUCT.md` and `CONTEXT.md` first (CONTEXT sections 4, 5 and 7 cover the research, typical pronunciation problems and feedback copy).

**Goal:** on every `shadow` node, the learner can listen to the line, say it aloud, and get kind, specific feedback in the browser: praise first, then **one** correction that names a word (research: feedback must name the word, not just say "wrong"). Shadowing is always optional and never blocks the story.

**Constraints:** zero cost and client-side only, so speech recognition is the browser's Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, Chrome, Edge and Safari). Firefox has no recognition: show "Trình duyệt này chưa hỗ trợ ghi âm. Bạn có thể bỏ qua hoặc mở bằng Chrome." and never crash. Until pre-generated mp3 audio exists, "listen" uses the browser's `speechSynthesis`.

Built in **phases**, each ending with `npm run lint` and `npm run build` passing and its own commit.

## Phases

- [x] **1. Matching and speech wrappers in `lib/`.** `lib/shadow.ts`: compare what the recognizer heard with the line, word by word (contractions, numbers, punctuation and hyphens normalised; names are lenient), and pick the feedback: a tier (great / good / retry / silent) and at most one tip (dropped word ending, *th* sound, or a missed word). `lib/speech.ts`: feature detection, a promise-based recognizer with a time limit and friendly error reasons, and `speak()` with `speechSynthesis`. Pure logic tested on all 40 shadow lines.
  - `checkShadow(line, alternatives, names)` aligns words with dynamic programming, so one dropped word does not shift the rest. A word is `ok`, `ending` (heard minus its last 1–2 letters: *walks* → *walk*), `close` (a similar word: *like* → *lie*) or `missed`. Score credit: 1 / 0.6 / 0.5 / 0. Tiers: great ≥ 0.85, good ≥ 0.6, else retry; no speech → silent. The best of the recognizer's alternatives is used.
  - The one tip prefers a dropped final sound, then a *th* word, then the longest missed word (CONTEXT.md 5). Names (capitalised mid-sentence, or any word of the page's character names passed as `names`) never lower the score.
  - `lib/speech.ts`: `listen()` returns `{ stop, cancel, result }` where `result` resolves to alternatives or a reason (`unsupported`, `denied`, `no-mic`, `no-speech`, `network`, `aborted`, `error`); it stops itself after 8 s. `speak()` / `stopSpeaking()` use `speechSynthesis` with an American voice. TypeScript has no `SpeechRecognition` types, so the file declares the small part it uses.
- [ ] **2. Shadow sheet.** The 🎙️ button under a shadow bubble opens a bottom sheet: the line and its translation, "🔊 Nghe" (normal and slow), "🎙️ Nói", a listening state, the result with each word marked kindly, praise + one tip, "Thử lại" and "Xong". Unsupported browser, blocked microphone and silence each get a friendly message. Tested in the browser with a fake recognizer.
- [ ] **3. Progress and polish.** Save the best result per line in `localStorage`, mark practised lines in the chat, and mention shadowing on the end-of-page screen. Then a real-microphone check by a human on Chrome (Android or desktop) and Safari (iOS), and tick the roadmap box in `docs/PRODUCT.md`.
- [ ] **4. Pre-generated audio (needs a decision first).** Generate mp3s for the 40 shadow lines offline with Kokoro or Piper (`public/audio/<story-id>/<node-id>.mp3`), and play them instead of `speechSynthesis` when present. Needs large local model downloads, so ask before starting.
