import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadLastPage, loadStories, loadStory } from "@/lib/content";
import { pageHref } from "@/lib/links";

// Placeholder for The Last Page (a later milestone): shows the writing question
// so the story has an ending to look forward to.

type Props = PageProps<"/story/[storyId]/last-page">;

export async function generateStaticParams() {
  const stories = await loadStories();
  return stories.map((story) => ({ storyId: story.id }));
}

async function getLastPage(storyId: string) {
  "use cache";
  cacheLife("max");
  const [story, lastPage] = await Promise.all([loadStory(storyId), loadLastPage(storyId)]);
  return story && lastPage ? { story, lastPage } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storyId } = await params;
  const data = await getLastPage(storyId);
  return { title: data ? `The Last Page · ${data.story.title}` : "The Last Page" };
}

export default function LastPageRoute({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8">
      <Suspense fallback={null}>
        <LastPagePlaceholder params={params} />
      </Suspense>
    </main>
  );
}

async function LastPagePlaceholder({ params }: Pick<Props, "params">) {
  const { storyId } = await params;
  const data = await getLastPage(storyId);
  if (!data) notFound();
  const { story, lastPage } = data;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link href="/" className="self-start text-sm text-muted underline-offset-4 hover:underline">
        ← Trang chủ
      </Link>

      <header className="text-center">
        <p className="text-4xl" aria-hidden>
          ✍️
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">The Last Page</h1>
        <p className="mt-1 font-serif text-muted italic">
          {story.title} · {story.titleVi}
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-card p-5">
        <p className="text-lg leading-relaxed">{lastPage.promptVi}</p>
        <p className="mt-3 font-serif text-wine italic">“{lastPage.pattern}”</p>
      </section>

      <p className="text-center leading-relaxed text-muted">
        Màn viết đoạn kết đang được xây dựng. Trong lúc chờ, bạn thử nghĩ xem mình muốn câu chuyện kết thúc thế nào
        nhé!
      </p>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/"
          className="w-full rounded-full bg-wine px-6 py-3 text-center font-medium text-paper transition active:scale-[0.98]"
        >
          Chọn truyện khác
        </Link>
        <Link
          href={pageHref(story.id, 1)}
          className="w-full rounded-full border border-line px-6 py-3 text-center font-medium transition active:scale-[0.98]"
        >
          Đọc lại từ trang 1
        </Link>
      </div>
    </div>
  );
}
