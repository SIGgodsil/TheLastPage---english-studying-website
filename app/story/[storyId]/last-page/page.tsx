import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadLastPage, loadPages, loadStories, loadStory } from "@/lib/content";
import { pageHref } from "@/lib/links";
import LastPageWriter from "@/components/LastPageWriter";

// The Last Page: the learner writes a new ending for the story.
// The original ending (authorNote) never reaches the browser.

type Props = PageProps<"/story/[storyId]/last-page">;

export async function generateStaticParams() {
  const stories = await loadStories();
  return stories.map((story) => ({ storyId: story.id }));
}

async function getLastPage(storyId: string) {
  "use cache";
  cacheLife("max");
  const [story, lastPage, pages] = await Promise.all([loadStory(storyId), loadLastPage(storyId), loadPages(storyId)]);
  if (!story || !lastPage || !pages) return null;
  const names = [...new Set(pages.flatMap((p) => Object.values(p.characters).map((c) => c.name)))];
  return { story, lastPage, names };
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
        <LastPageScreen params={params} />
      </Suspense>
    </main>
  );
}

async function LastPageScreen({ params }: Pick<Props, "params">) {
  const { storyId } = await params;
  const data = await getLastPage(storyId);
  if (!data) notFound();
  const { story, lastPage, names } = data;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <nav className="flex items-center justify-between text-muted">
        <Link
          href={pageHref(story.id, story.pages)}
          className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-ink/30 hover:text-ink"
        >
          ← Trang {story.pages}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-ink/30 hover:text-ink"
        >
          Trang chủ
        </Link>
      </nav>

      <header className="text-center">
        <p className="eyebrow text-wine">Trang cuối · Viết đoạn kết</p>
        <h1 translate="no" className="mt-2 text-[2.4rem] leading-none tracking-tight">
          The Last Page
        </h1>
        <p className="mt-2 text-lg text-muted italic">
          {story.title} · {story.titleVi}
        </p>
        <div aria-hidden className="mx-auto mt-4 flex w-32 items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="size-1.5 rounded-full bg-wine/70" />
          <span className="h-px flex-1 bg-line" />
        </div>
      </header>

      <section className="shadow-paper rounded-3xl border border-line bg-card px-5 py-5">
        <p className="eyebrow text-muted">Câu hỏi</p>
        <p className="mt-1.5 text-xl leading-relaxed">{lastPage.promptVi}</p>
        <div aria-hidden className="my-4 h-px bg-line" />
        <p className="eyebrow text-wine">Mẫu câu</p>
        <p lang="en" className="mt-1.5 text-lg text-wine italic">
          {lastPage.pattern}
        </p>
      </section>

      <LastPageWriter
        storyId={story.id}
        storyTitle={story.title}
        pattern={lastPage.pattern}
        moods={lastPage.moods}
        starters={lastPage.starters}
        wordBank={lastPage.wordBank}
        modelEndings={lastPage.modelEndings}
        names={names}
      />
    </div>
  );
}
