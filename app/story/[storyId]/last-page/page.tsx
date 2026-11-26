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
      <nav className="flex items-center justify-between text-sm text-muted">
        <Link href={pageHref(story.id, story.pages)} className="underline-offset-4 hover:underline">
          ← Trang {story.pages}
        </Link>
        <Link href="/" className="underline-offset-4 hover:underline">
          Trang chủ
        </Link>
      </nav>

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
        <p className="mt-3 text-xs font-medium tracking-wide text-muted uppercase">Mẫu câu</p>
        <p lang="en" className="mt-1 font-serif text-lg text-wine italic">
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
