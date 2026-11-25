import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatPlayer from "@/components/ChatPlayer";
import { loadPages, loadStories, loadStory } from "@/lib/content";
import { buildGlossary } from "@/lib/vocab";

type Props = PageProps<"/story/[storyId]/[page]">;

export async function generateStaticParams() {
  const stories = await loadStories();
  return stories.flatMap((story) =>
    Array.from({ length: story.pages }, (_, i) => ({ storyId: story.id, page: String(i + 1) })),
  );
}

/** Content is static, so it is cached for as long as Next.js allows. */
async function getChat(storyId: string, rawPage: string) {
  "use cache";
  cacheLife("max");
  if (!/^[1-9]\d*$/.test(rawPage)) return null;
  const pageNumber = Number(rawPage);
  const [story, pages] = await Promise.all([loadStory(storyId), loadPages(storyId)]);
  const page = pages?.find((p) => p.page === pageNumber);
  if (!story || !pages || !page) return null;
  // Words from this page and earlier ones: a word is defined where it first appears.
  return { story, page, glossary: buildGlossary(pages, pageNumber) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storyId, page } = await params;
  const chat = await getChat(storyId, page);
  return { title: chat ? `${chat.page.title} · ${chat.story.title} · The Last Page` : "The Last Page" };
}

export default function StoryPage({ params }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      {/* Reading params is URL data: keep it inside Suspense so navigations show a shell at once. */}
      <Suspense fallback={<ChatSkeleton />}>
        <Chat params={params} />
      </Suspense>
    </div>
  );
}

async function Chat({ params }: Pick<Props, "params">) {
  const { storyId, page } = await params;
  const chat = await getChat(storyId, page);
  if (!chat) notFound();

  return (
    <>
      <ChatHeader page={chat.page} totalPages={chat.story.pages} />
      <ChatPlayer
        storyId={chat.story.id}
        page={chat.page}
        totalPages={chat.story.pages}
        glossary={chat.glossary}
      />
    </>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-2.5" aria-busy>
      <span className="size-9" />
      <span className="size-10 animate-pulse rounded-full bg-line motion-reduce:animate-none" />
      <span className="h-4 w-32 animate-pulse rounded bg-line motion-reduce:animate-none" />
    </div>
  );
}
