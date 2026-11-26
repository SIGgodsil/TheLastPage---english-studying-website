import { cacheLife } from "next/cache";
import StoryShelf from "@/components/StoryShelf";
import { loadStories } from "@/lib/content";

async function getStories() {
  "use cache";
  cacheLife("max");
  return loadStories();
}

/** Home: straight into the story. The first button is always one tap from reading. */
export default async function Home() {
  const stories = await getStories();
  return (
    <main className="mx-auto w-full max-w-xl px-5 pt-7 pb-16">
      <header className="text-center">
        <p className="eyebrow text-muted">Truyện ma kinh điển · Tiếng Anh A2–B1</p>
        <h1 translate="no" className="mt-2 text-[2.6rem] leading-none tracking-tight">The Last Page</h1>
        <p className="mt-2 text-muted italic">Turn to the last page — and change it.</p>
        <div aria-hidden className="mt-5 border-t-2 border-ink" />
        <div aria-hidden className="mt-[3px] border-t border-ink" />
      </header>
      <StoryShelf stories={stories} />
      <footer className="mt-14 border-t border-line pt-4 text-center text-sm text-muted italic">
        Miễn phí · Không quảng cáo · Không cần đăng ký
      </footer>
    </main>
  );
}
