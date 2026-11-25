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
    <main className="mx-auto w-full max-w-xl px-4 pt-6 pb-12">
      <header className="mb-5">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          <span aria-hidden>📖 </span>The Last Page
        </h1>
        <p className="font-serif text-sm text-muted italic">Turn to the last page — and change it.</p>
      </header>
      <StoryShelf stories={stories} />
    </main>
  );
}
