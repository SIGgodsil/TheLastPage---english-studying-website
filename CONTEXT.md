# Project Context — The Last Page

This file explains **why** the project is the way it is: the decisions made, the ideas rejected, the research behind them and the writing style for content. Read it together with:

| File | What it answers |
|---|---|
| `CLAUDE.md` | Rules and constraints when writing code |
| `docs/PRODUCT.md` | What the product does (features, content format, roadmap) |
| `docs/CONTEXT.md` | Why it is designed this way, and how content should sound (this file) |
| `docs/TASK-MVP.md` | What to build right now |

When a request is ambiguous, use this file to choose the option that best fits the project's intent. If something here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## 1. How the idea evolved

1. **Starting point:** an MVP for learning English through stories.
2. Six concepts were explored: tap-to-translate stories, serialized episodes, choose-your-own-adventure, chat-message stories, AI-personalised stories, and listen-and-shadow.
3. **Chosen:** branching stories + chat-message format + shadowing, combined into one experience: *the story happens in a chat; the learner replies by choosing messages or sending voice messages.*
4. **Added:** build everything around **one real, existing story** and let the learner **rewrite the ending**. This became the name and the final screen: *The Last Page*.
5. **Level:** first A1–A2, then narrowed to **A2–B1**.
6. **Business model:** **no notifications, no fees, no development cost.** The app is a free, non-commercial project.
7. **Hosting:** Vercel Hobby (free, non-commercial use only).
8. **Name:** *The Last Page*. Slogan: *Turn to the last page — and change it.*

## 2. Decision log

| Decision | Reason |
|---|---|
| Stories are told as **chat messages** | Short messages fit A2–B1 sentence length and phones. Voice messages make speaking practice feel natural, not like a drill |
| **Branching choices** | Choices give learners a sense of control, a strong driver of motivation. Wrong choices lead to other branches, never to punishment |
| **Shadowing** of key lines | Practises speaking without needing a conversation partner. Research shows benefits for fluency and intonation |
| **Rewrite the ending** as the final goal | Gives the whole story a purpose: every word learned is a tool for the ending. It also produces something learners want to share |
| **Public-domain classics** (*The Monkey's Paw* first) | Free to adapt legally. *The Monkey's Paw* has wishes (natural branches), suspense (cliffhangers) and an ending people want to change. It also fits the second conditional, a key B1 grammar point |
| **Modern retelling** | The family texts each other today, which makes the chat format believable |
| **A2+ base text plus optional B1 challenges** | One version of the content instead of two halves the writing work |
| **Pre-written content**, no live AI story generation | Zero cost, consistent quality, no waiting time |
| **Browser-only speech** (Web Speech API) | Free. Accuracy is lower than paid pronunciation APIs, but good enough to validate the idea |
| **No accounts, `localStorage` only** | Learners reach the story in under 60 seconds. No database cost |
| **Share endings by link** (`lz-string` in the URL) | Sharing with no server storage |
| **No push notifications** | Product decision. Retention must come from inside the experience: cliffhangers, waiting messages in the app, a gentle streak |

## 3. Rejected or postponed ideas

| Idea | Status | Why |
|---|---|---|
| AI-generated stories on the fly | Rejected for MVP | Costs money, slow (a research prototype took over a minute to start a story), inconsistent quality and plot |
| Copyrighted stories (Harry Potter, Disney…) | Rejected | Needs a licence |
| Paid pronunciation scoring (e.g. Azure Pronunciation Assessment) | Postponed | Costs money. Revisit only if a free option appears |
| Hearts or lives, lock-outs after mistakes | Rejected | Raises anxiety and drop-out among shy learners |
| Placement test and forced sign-up at the start | Rejected | Most drop-off happens before learners reach the content |
| Push or email notifications | Rejected | Product decision |
| Payments, ads | Rejected | Free, non-commercial project (also required by Vercel Hobby) |
| A1 learners | Out of scope | A1 learners cannot yet read a story plot in English. Possible future spin-off with very familiar tales (e.g. *Tấm Cám*) |
| Community voting on endings | Postponed | Needs storage. Possible later via free tools such as Giscus |

## 4. Research behind the design

| Finding | Source | What it means for us |
|---|---|---|
| An LLM-based branching text adventure for A2–B1 EFL students: learners retained about two-thirds of the words they looked up | GenQuest (EMNLP 2025 Wordplay workshop, arXiv:2510.04498) | Tap-to-understand plus a saved word list works |
| Learners in that study asked for glosses in their own language, looked-up words reused in later stories, illustrations, shorter passages and no long waits | Same | Vietnamese glosses, vocabulary recycling across pages, emoji and visuals, 5-minute pages, pre-written content |
| Dialogue-based systems improve L2 speaking (g = .61). Goal-oriented systems work best. Mixed text and voice beats voice-only | Hou & Min (2025), *ReCALL* | Each page has a concrete in-story task. Chat combines text and voice |
| Beginners and intermediates benefit more than advanced learners | Same | A2–B1 is a good target |
| Chatbot interventions have a large effect on speaking (g = 1.035). Long-term use has a much bigger effect than short-term use | Kansizoglu & Kayhan (2026), *Turkish Online Journal of Distance Education* | Retention is a learning goal, not just a growth metric |
| Automatic speech recognition improves pronunciation (g = 0.69), most of all with explicit corrective feedback. It has a strong effect on individual sounds and a weak one on intonation | Ngo, Chen & Lai (2024), *ReCALL* 36(1) | Shadowing feedback must name the specific word, not just say "wrong" |
| Shadowing improves fluency and intonation. Learners find it enjoyable | Systematic review, University of Oxford MSc (2025) | Shadowing (intonation) and speech recognition (sounds) complement each other |
| Learners felt less speaking anxiety with an AI than with a human, though one study found no measurable change in anxiety | Susoy (2026), *Frontiers in Psychology*; Columbia study | A low-pressure, private speaking space is valuable, but do not over-claim |
| Gamification has only a small effect on intrinsic motivation (g = 0.257) | Meta-analysis, *Educational Technology Research & Development* (2023) | Story and a sense of progress are the core. Points and badges are seasoning |
| Duolingo: learners with a 7-day streak are 2.4x more likely to return the next day. Tying the streak to a demanding daily goal hurt habit-forming | Duolingo blog | Keep the streak, but one small action is enough to keep it |

## 5. Learner persona

- **Who:** Vietnamese university students and young working adults, CEFR A2–B1
- **Pain points:** bored by textbook apps, afraid of making mistakes when speaking, no time for long lessons
- **Habits:** phone-first, short sessions (around 5 minutes), often in the evening
- **Typical pronunciation problems** for feedback to focus on:
  - Dropped final consonants (*like* → "lai", *suitcase* → "suitca")
  - Missing *-s* and *-ed* endings
  - *th* sounds (/θ/, /ð/)
  - Word stress

## 6. Story adaptation guide (for writing JSON content)

### Setting and roles
- *The Monkey's Paw* is retold **today**. The White family texts, sends voice messages and uses emoji.
- **The learner** is Herbert's best friend and a member of the chats.

### Characters' texting voices
| Character | Personality | How they text |
|---|---|---|
| **Herbert White** | Funny, teasing, brave | Short messages, lots of emoji, jokes |
| **Mr. White** | Curious, hopeful, a little greedy | Slower, full sentences, proper punctuation, few emoji |
| **Mrs. White** | Warm, practical, worried | Caring questions, ❤️, "Be careful" |
| **Sergeant-Major Morris** | Serious, mysterious | Very short sentences, no emoji, warnings |

### Language rules
| | A2 base text | B1 challenge |
|---|---|---|
| Sentence length | 6–10 words | 8–15 words |
| Grammar | Present and past simple, *going to*, comparatives | Present perfect, first and second conditional, modals, reported speech |
| New words per page | 6–8 | 8–12 |

- Aim for **about 95% known words**. Unknown words should be guessable from context.
- **Recycle vocabulary:** every new word appears 3–4 times on its page and again on later pages.
- Thread the **second conditional** through the story (*"If I had one wish, I would…"*), so learners can use it in their ending.

### Story-craft rules
- Every page ends on a **cliffhanger**.
- Branches **rejoin** the main plot. No dead ends.
- Keep the original plot faithful in spirit, but **write all English fresh**. Do not copy passages from the 1902 text.
- Horror is suggested, not shown: suspense, never gore.
- Give important messages a `vi` translation. Keep Vietnamese natural, not machine-like.

## 7. Vietnamese UI copy style

- Address the learner as **"bạn"**. Friendly, short and encouraging.
- Praise first, then **one** correction at a time.
- Never use words like "Sai rồi!" (Wrong!) or show harsh red error states.

| Situation | Example copy |
|---|---|
| Good shadowing | "Tuyệt vời! Phát âm rất rõ 👏" |
| Okay shadowing | "Khá lắm! Thử nói rõ âm cuối của từ **suitcase** nhé." |
| Retry | "Thử lại nhé, bạn sắp được rồi!" |
| Speech not supported | "Trình duyệt này chưa hỗ trợ ghi âm. Bạn có thể bỏ qua hoặc mở bằng Chrome." |
| Missed a day | "Chào mừng bạn quay lại! Câu chuyện vẫn đang chờ bạn." |
| Writing feedback | "Đoạn kết rất sáng tạo! Bạn đã dùng 4 từ mới. Một gợi ý nhỏ: …" |

## 8. Glossary

| Term | Meaning |
|---|---|
| **Page** | One chapter of a story (about 5 minutes) |
| **The Last Page** | The final screen, where the learner writes a new ending |
| **Node** | One step in a page: `message`, `choice`, `shadow`, `free-reply` or `cliffhanger` |
| **Shadowing** | Listening to a line and repeating it aloud |
| **Tiered hints** | 💡 hint → key-word translations → suggested answer |
| **B1 challenge** | Optional harder task (free reply, longer ending) |
| **Waiting messages** | Unread badges from characters shown on the home screen inside the app (not notifications) |

## 9. Open questions

- Primary segment: students or young workers? Currently assumed **young adults**, so the tone should not be childish.
- Which story comes after *The Monkey's Paw*? Candidates: *The Gift of the Magi*, *The Happy Prince*, *Tấm Cám* (English).
- Analytics tool: Vercel Web Analytics or GoatCounter?
- TTS voices for each character (Kokoro or Piper) are not chosen yet.
