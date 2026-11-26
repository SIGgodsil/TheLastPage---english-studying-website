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
- [x] **2. Shadow sheet.** The 🎙️ button under a shadow bubble opens a bottom sheet: the line and its translation, "🔊 Nghe" (normal and slow), "🎙️ Nói", a listening state, the result with each word marked kindly, praise + one tip, "Thử lại" and "Xong". Unsupported browser, blocked microphone and silence each get a friendly message. Tested in the browser with a fake recognizer.
  - `components/ShadowPractice.tsx`: the "🎙️ Luyện nói" button and its sheet. The sheet's state lives in its content, which unmounts on close, so closing always cancels listening and speech. The page's character names are passed to `checkShadow`. Copy lives in `components/shadowCopy.tsx`.
  - Words not heard clearly are underlined in wine (dotted); missed words are muted with a dashed underline. No red, no crosses.
  - `WordSheet` and the shadow sheet share `components/BottomSheet.tsx`.
  - The browser pane's Chromium has a real `SpeechRecognition` but no microphone, which checked the "denied" path for real. Everything else was checked with a fake recognizer (heard / partial / silent / network / no mic / stop / close while listening / unsupported). A real microphone still needs a human (phase 3).
- [x] **3. Progress and polish.** Save the best result per line in `localStorage`, mark practised lines in the chat, and mention shadowing on the end-of-page screen. Then a real-microphone check by a human on Chrome (Android or desktop) and Safari (iOS), and tick the roadmap box in `docs/PRODUCT.md`.
  - Code done: `saveShadow()` keeps the best score per line in `StoryProgress.shadow` (key `"<page>/<node id>"`; silence is not saved; `completePage` keeps it). The chip under a shadow bubble becomes "🎙️ Luyện lại ✓" (any attempt) or "⭐" (score ≥ 0.85), and the end-of-page screen offers "🎙️ Luyện nói câu của trang này". Saves fire a same-tab event, so `useProgress()` views update at once.
  - **Earlier note:** the real-microphone check. Chrome only allows the microphone on `https://` or `localhost`, so test on a computer at `http://localhost:3000` (Chrome or Edge), or on a phone after deploying to Vercel. Tick this phase and the roadmap box once it works.
  - **First real-mic try (2026-11-25, desktop, localhost):** the stop button could hang (fixed: stop now finishes after a 4 s grace period), and slow playback was too fast (now rate 0.5). Recognition still heard nothing: the new status line stayed on "Micro đang bật, chưa nghe thấy tiếng", so the browser recorded but got no sound. This points to the wrong input device or a muted mic on that computer, not the app. Set aside by the user for later: check the device in `chrome://settings/content/microphone` (or Windows sound settings), then try again.
  - **Second try (2026-11-26):**
    - After the user chose the right microphone, Chrome heard their voice, but its speech service never answered. The trace showed `audiostart · soundstart · speechstart · stop · no-end`, with no results and no error.
    - The same page works in **Edge** (Microsoft's speech service), so the app is fine. On that computer, Chrome's link to Google's service is blocked or missing (a VPN, a firewall, or the browser build).
    - The app now explains this case (`no-reply`) and shows a "Chi tiết kỹ thuật" trace on any failed attempt.
    - Phone browsers (Android Chrome, iOS Safari) are not yet tested: they need an https deploy.
  - **Change asked for by the user (2026-11-26):**
    - Listening no longer stops on its own. Recognition runs in continuous mode until the learner presses "✓ Đọc xong".
    - If the browser ends a session by itself (a pause, its own time limit), listening restarts, and the words heard so far are kept. It restarts at most 20 times.
    - A 60-second safety limit remains.
- [ ] **4. Pre-generated audio with ElevenLabs (asked for by the user on 2026-11-26).**
  - The voice is made **once, offline**, never while the app runs. The app calls no paid API and needs no key.
  - `scripts/generate-audio.mjs` reads the 40 shadow lines (about 1,250 characters in total) and calls the ElevenLabs text-to-speech API with the key from the `ELEVENLABS_API_KEY` environment variable. The user sets that variable in their own terminal; it is never written to a file or committed.
  - It writes `public/audio/<story-id>/<node-id>.mp3` and skips files that already exist, so a rerun costs nothing.
  - The shadow sheet plays the mp3 when there is one: "Nghe" at normal speed, "Nghe chậm" at a slower rate. When there is no mp3 it falls back to `speechSynthesis`.
  - **Licence:** the free plan (10,000 credits a month) allows non-commercial use with attribution, so the app credits ElevenLabs (for example in the shadow sheet or an About line). Commercial use would need a paid plan.
  - Voices: a female and a male voice, chosen by character in `scripts/voices.json`. To use one voice for every line, give every character the same kind there.
  - **Code done (2026-11-26):**
    - `scripts/generate-audio.mjs` (`npm run audio -- --dry-run`) makes `public/audio/<story-id>/p<page>-<node-id>.mp3` and lists the files in `lib/audio-manifest.json`, so the app only requests files that exist.
    - `lib/audio.ts` (`shadowAudio()`) looks a line up. `playRecording()` in `lib/speech.ts` plays it; "Nghe chậm" uses rate 0.65 and keeps the pitch. If a file fails to play, the app uses the browser's voice. When a recording is used, the sheet shows "Giọng đọc tạo bằng ElevenLabs".
    - Tested against a fake ElevenLabs server (wrong key, voice list, making files, skipping existing files) and in the browser (recording at normal and slow speed, the credit line, and the fallback when a file is missing). No real audio is committed yet.
  - **Still open:** the user runs the script with their own key, listens to a few files, and commits `public/audio/` with `lib/audio-manifest.json`. Then tick this phase.
  - How to run, in PowerShell:
    ```
    $env:ELEVENLABS_API_KEY = "<key from elevenlabs.io → Profile → API keys>"
    npm run audio -- --dry-run      # see the 40 lines and voices; no credits used
    npm run audio                   # make the files (about 1,230 characters)
    npm run audio -- --list-voices  # voice ids for scripts/voices.json
    npm run audio -- --only nam-xuong --force   # remake one story after changing a voice
    ```
