import Link from "next/link";

// Placeholder home (MVP phase 1). Phase 5 replaces it with a screen that
// goes straight into the story and resumes saved progress.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        📖
      </p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">The Last Page</h1>
      <p className="font-serif text-lg italic text-muted">Turn to the last page — and change it.</p>
      <p className="leading-relaxed">
        Học tiếng Anh qua truyện kinh điển, kể bằng tin nhắn. Bạn chọn câu trả lời, luyện nói theo nhân vật và
        tự viết lại đoạn kết.
      </p>
      <Link
        href="/story/monkeys-paw/1"
        className="mt-2 w-full rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
      >
        Đọc <span className="font-serif italic">The Monkey&apos;s Paw</span>
      </Link>
    </main>
  );
}
