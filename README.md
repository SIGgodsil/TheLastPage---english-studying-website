# 📖 The Last Page

> **Turn to the last page — and change it.**

**The Last Page** is a free web app that helps Vietnamese learners at **A2–B1** level learn English through classic stories. Each story is retold as **chat messages**: learners step into the story, make choices that change where it goes, practise speaking by **shadowing** the characters' lines, and finally **rewrite the ending**, writing a last page of their own.

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 💬 | **Chat-based stories** | The story unfolds as messages between characters, in short, natural sentences built for mobile |
| 🔀 | **Branching choices** | Learners pick English replies, and each choice takes the story somewhere different. Wrong choices are never punished |
| 👆 | **Tap to understand** | Tap any word for a simple English explanation, the Vietnamese meaning and its pronunciation |
| 🎙️ | **Shadowing** | Record yourself repeating the characters' lines and get instant feedback in the browser |
| ✍️ | **The Last Page** | In the final chapter, learners write a new ending, get feedback and revise it |
| 🔗 | **Sharing** | Share your ending with a link, no account needed |

## 🎯 Who it's for

- Vietnamese learners at **A2–B1** (elementary to intermediate)
- People who want a learning habit that **isn't boring**, about 5 minutes a day
- Learners who are shy about speaking and need a **low-pressure** place to practise

## 🧭 Learning flow

```
Page 1 → Page 2 → … → Page N → ✍️ The Last Page
  │
  ├─ 💬 Read the messages, tap new words to see their meaning
  ├─ 🔀 Choose replies that shape the story
  ├─ 🎙️ Shadow key lines of dialogue
  └─ 🪝 Every chapter ends on a cliffhanger
```

## 🧪 Design principles

Based on research into interactive narrative games, dialogue-based language learning, shadowing and automatic pronunciation feedback:

1. **Learn through story tasks**, not isolated exercises
2. **Combine text and voice** in a single chat interface
3. **About 95% comprehensible**: only 6–12 new words per chapter, recycled in later chapters
4. **Mistakes are safe**: tiered hints, praise first, and only one correction at a time
5. **Straight into the story**: no sign-up and no placement test

## 💸 Completely free

The project is designed to cost nothing for learners or developers:

- No fees, no ads, no sign-up required
- No paid APIs: the core features run entirely in the browser
- Hosted on Vercel's free Hobby plan

## 🛠️ Tech stack

| Component | Tool |
|---|---|
| Framework | [Next.js](https://nextjs.org/) |
| Hosting | [Vercel](https://vercel.com/) (Hobby plan) |
| Story content | Pre-written JSON files |
| Audio | Pre-generated with open-source TTS ([Kokoro](https://github.com/hexgrad/kokoro) / [Piper](https://github.com/rhasspy/piper)) |
| Pronunciation check | Browser [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) |
| Grammar check | [LanguageTool](https://languagetool.org/) public API plus rule-based checks |
| Progress | `localStorage`, no account needed |

## 📁 Project structure (planned)

```
the-last-page/
├── app/                  # Next.js UI
│   └── api/check/        # Serverless function for grammar checks
├── content/
│   └── monkeys-paw/
│       ├── page-1.json   # Messages, branches, vocabulary, shadowing lines
│       └── …
├── public/
│   └── audio/            # Pre-generated mp3 files
└── README.md
```

## 🚀 Getting started

```bash
git clone https://github.com/<your-username>/the-last-page.git
cd the-last-page
npm install
npm run dev
```

Open http://localhost:3000 in Chrome, Edge or Safari. Voice recording is not yet supported in Firefox.

## 📚 Stories

| Story | Author | Year | Status |
|---|---|---|---|
| *The Monkey's Paw* | W. W. Jacobs | 1902 | 🚧 In progress |
| *The Gift of the Magi* | O. Henry | 1905 | 📝 Planned |
| *Tấm Cám* (English version) | Vietnamese folk tale | — | 📝 Planned |

All original stories are in the **public domain**. The in-app versions are new adaptations rewritten for A2–B1 learners.

## 🗺️ Roadmap

- [ ] **MVP:** *The Monkey's Paw*, 5–6 chapters with chat, branching and tap-to-understand
- [ ] Shadowing with pronunciation feedback via the Web Speech API
- [ ] **The Last Page** screen: write an ending, get feedback, share it by link
- [ ] Daily streaks and in-app waiting messages
- [ ] More stories
- [ ] Community page to read and vote on endings

## 🤝 Contributing

Contributions are welcome: story adaptations, vocabulary notes, bug fixes and UI improvements. Open an [issue](../../issues) or send a pull request.

## 📄 License

The source code is released under the [MIT License](LICENSE).
