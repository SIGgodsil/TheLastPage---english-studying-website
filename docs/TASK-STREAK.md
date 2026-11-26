# Task: daily streak and daily missions

Roadmap item: "Daily streaks" (`docs/PRODUCT.md` section 7). Waiting messages
from characters are a separate, later task.

## Goal

Give learners a small reason to come back every day for about 5 minutes,
without guilt. Everything stays in `localStorage`: no account, no server, no
push notifications.

## Rules (defaults, change before phase 1 if needed)

- **A study day** counts when the learner **finishes one chat page** that day
  (about 5 minutes, the core of the app). Days use the phone's local date.
- **Streak** ("Chuỗi ngày học"): consecutive study days, shown as 🔥 N.
- **Never punished** (CLAUDE.md UX rule 1):
  - **One rest day a week**: missing a single day in a Monday–Sunday week does
    not break the streak. It shows as a quiet "nghỉ" day.
  - When a streak does break, the message is kind ("Chào mừng bạn quay lại!
    Bắt đầu chuỗi mới nào."), never a red warning. The best streak is kept
    ("Kỷ lục: 12 ngày").
- **Three missions a day** ("Nhiệm vụ hôm nay"), picked from the date so they
  are the same all day and change at midnight:
  1. Always: **Đọc xong 1 trang**.
  2. and 3. Two from this pool, each about a minute:
     - Tra nghĩa 5 từ
     - Xem 3 ghi chú "Cấu trúc"
     - Nghe phát âm 3 từ (🔊)
     - Luyện nói 1 câu (only offered when the browser supports speech
       recognition)
     - Chọn 2 câu trả lời trong truyện
- **Swap once a day**: a mission the learner cannot or does not want to do can
  be swapped for another one, once per day.
- **All three done**: a small celebration and a ⭐ on that day in the week strip.
  No points, no shop, no levels.

## Plan

### Phase 1: the daily engine (`lib/daily.ts`)

- [x] Local date keys (`YYYY-MM-DD`), week starting Monday.
- [x] Mission pool and the date-seeded pick (same three all day). A day's
      missions are stored with its first activity, so they never change
      mid-day.
- [x] `recordActivity(kind)`: counts word lookups, notes opened, 🔊 plays,
      shadow attempts, choices and finished pages for today, and reports the
      missions it just finished. `track(kind)` is the browser wrapper (never
      throws); `onMissionDone` lets the chat show a toast.
- [x] Streak: current, best, rest-day rule, broken-streak detection, and the
      Monday–Sunday strip (⭐ / done / rest / today / missed / future).
- [x] Storage under its own key `tlp:daily` (zod-checked, try/catch, keeps the
      last 60 days; `best` survives pruning), with a change event so open
      views update.
- [x] Swap rule: once a day, never "Đọc xong 1 trang", never a finished one.
- [x] 16 scratch tests in Node: day and year changes, rest days (also across a
      week boundary), broken streaks, swaps, pruning, bad stored data.

Notes:
- The streak counts study days; rest days keep it alive but do not add to it.
- Today never breaks a streak: until midnight the day is still open.

### Phase 2: count what the learner does

- [x] `track()` is called when a word opens, a "Cấu trúc" note opens (not
      when it closes), 🔊 plays, a choice is made, a shadowing attempt is
      scored (silence does not count) and a page is finished.
- [x] A toast when a mission is done ("✓ Xong nhiệm vụ: Tra nghĩa 5 từ", or
      "⭐ Xong cả 3 nhiệm vụ hôm nay!"). It lives in the root layout and is a
      manual popover, so it shows above the shadowing sheet too.

### Phase 3: show it

- [x] Home page: a "Hôm nay" card under the "continue" card: 🔥 streak, best
      streak, a Monday–Sunday strip (⭐ / ✓ / nghỉ / today / missed / future,
      each with a spoken label) and the three missions with progress. The
      "Đọc tiếp" button stays on the continue card right above it, so the card
      has none of its own (the first button on the home page is still one tap
      from reading).
- [x] End of a page: one line on the streak ("🔥 3 ngày học liên tiếp!" or
      "Ngày học đầu tiên của chuỗi!") and how many missions are left today.
- [x] Kind lines for each case: a new learner, a streak to keep today, a
      streak kept, and a welcome back after a broken streak; the best streak
      stays visible.
- [x] The mission toast moved to the top of the screen (under the chat header)
      so it never covers the buttons at the end of a page.

### Phase 4: finishing touches

- [x] "Đổi" (once a day) on each unfinished mission except "Đọc xong 1 trang",
      with a one-line hint; after one swap the buttons go away until tomorrow.
- [x] Celebration when all three missions are done: a wine-red toast
      ("⭐ Xong cả 3 nhiệm vụ hôm nay!") with a small burst of rising stars,
      shown for 5 s; the stars are left out under reduced motion. The home
      card says the day is done and the week strip shows ⭐.
- [x] Days before the learner's very first study day show as empty, not as
      missed, so a new learner never starts with grey "missed" days.
- [x] Checked at 360px: card, swap, toast, end-of-page line. Lint and build
      pass; roadmap box ticked in `docs/PRODUCT.md`.

## Out of scope

- Push notifications or e-mail reminders (CLAUDE.md: none).
- Syncing the streak across devices (no accounts).
- Waiting messages from characters: a later task.
