import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import SharedEndingView, { type SharedStory } from "@/components/SharedEndingView";
import { loadStories } from "@/lib/content";

// A shared ending, read-only. The ending travels in the URL fragment (#…),
// which never reaches the server, so this page is the same static page for
// every link and the browser decodes the ending.

export const metadata: Metadata = {
  title: "Một đoạn kết mới · The Last Page",
  description: "Một người bạn đã viết lại đoạn kết của một truyện ma kinh điển bằng tiếng Anh.",
  robots: { index: false },
};

async function getStories(): Promise<SharedStory[]> {
  "use cache";
  cacheLife("max");
  const stories = await loadStories();
  return stories.map(({ id, title, titleVi, origin, level }) => ({ id, title, titleVi, origin, level }));
}

export default async function SharedPage() {
  const stories = await getStories();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8">
      <SharedEndingView stories={stories} />
    </main>
  );
}
