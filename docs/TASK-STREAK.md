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

- [ ] Call `recordActivity` from the word popover, "Cấu trúc", 🔊, choices,
      shadowing and page completion.
- [ ] A small toast in the chat when a mission is done
      ("✓ Xong nhiệm vụ: Tra nghĩa 5 từ").

### Phase 3: show it

- [ ] Home page: a "Hôm nay" card above the shelf: 🔥 streak, a Monday–Sunday
      strip (done ✓ / rest / ⭐ / today), the three missions with progress, and
      a "Đọc tiếp" button to the story last read.
- [ ] End of a page: one line on the streak ("🔥 3 ngày liên tiếp!").
- [ ] Kind return message after a broken streak; best streak shown.

### Phase 4: finishing touches

- [ ] "Đổi nhiệm vụ" (once a day) on each mission except "Đọc xong 1 trang".
- [ ] Celebration when all three missions are done (respects reduced motion).
- [ ] Check at 360px, lint, build; tick the roadmap box in `docs/PRODUCT.md`.

## Out of scope

- Push notifications or e-mail reminders (CLAUDE.md: none).
- Syncing the streak across devices (no accounts).
- Waiting messages from characters: a later task.
