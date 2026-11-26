import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import IntroStart from "@/components/IntroStart";
import { loadStories, loadStory } from "@/lib/content";

// The story's introduction, before page 1: where and when, the set-up (no
// spoilers), who the learner is, whose messages they read, and how to play.

type Props = PageProps<"/story/[storyId]">;

export async function generateStaticParams() {
  const stories = await loadStories();
  return stories.map((story) => ({ storyId: story.id }));
}

async function getStory(storyId: string) {
  "use cache";
  cacheLife("max");
  return loadStory(storyId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storyId } = await params;
  const story = await getStory(storyId);
  return { title: story ? `${story.title} · Giới thiệu · The Last Page` : "The Last Page" };
}

export default function IntroRoute({ params }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-6 pb-14">
      <Suspense fallback={null}>
        <Intro params={params} />
      </Suspense>
    </main>
  );
}

const HOW_TO: { title: string; text: string }[] = [
  { title: "Đọc", text: "Tin nhắn hiện ra từng cái một. Bấm “Tiếp” để đọc tin tiếp theo." },
  {
    title: "Tra từ",
    text: "Từ có gạch chấm là từ mới: bấm vào để xem nghĩa. Bấm “Dịch” dưới tin nhắn nếu cần bản tiếng Việt.",
  },
  {
    title: "Trả lời",
    text: "Khi đến lượt bạn, hãy chọn một câu trả lời. Không có câu nào sai: mỗi lựa chọn mở ra một hướng khác. Cần thì bấm “💡 Gợi ý”.",
  },
  { title: "Luyện nói", text: "Gặp nút “🎙️ Luyện nói”, hãy nghe rồi đọc to theo câu đó." },
];

async function Intro({ params }: Pick<Props, "params">) {
  const { storyId } = await params;
  const story = await getStory(storyId);
  if (!story) notFound();
  const { intro } = story;

  return (
    <div className="flex flex-1 flex-col gap-7">
      <nav>
        <Link
          href="/"
          className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-ink/30 hover:text-ink"
        >
          ← Trang chủ
        </Link>
      </nav>

      <header className="text-center">
        <p className="eyebrow text-wine">
          {story.themeVi} · {story.origin === "vn" ? "Truyện Việt Nam" : "Truyện phương Tây"} · {story.level}
        </p>
        <h1 lang="en" className="mt-3 text-[2.4rem] leading-tight text-balance">
          {story.title}
        </h1>
        <p className="mt-1 text-xl text-muted italic">{story.titleVi}</p>
        <p className="mt-2 text-sm text-muted">
          {story.source} · {story.pages} trang · Độ sợ{" "}
          <span role="img" aria-label={`${story.fearLevel}/3`} className="ml-1 inline-flex gap-1 align-middle">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`size-1.5 rounded-full ${i <= story.fearLevel ? "bg-wine" : "bg-line"}`} />
            ))}
          </span>
        </p>
        <div aria-hidden className="mx-auto mt-4 flex w-32 items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="size-1.5 rounded-full bg-wine/70" />
          <span className="h-px flex-1 bg-line" />
        </div>
      </header>

      <section aria-labelledby="story-title" className="shadow-paper rounded-3xl border border-line bg-card px-5 py-5">
        <h2 id="story-title" className="eyebrow text-muted">
          Câu chuyện
        </h2>
        <p className="mt-2 text-muted italic">{intro.settingVi}</p>
        <p className="mt-2 text-[1.1rem] leading-relaxed">{intro.summaryVi}</p>
      </section>

      <section aria-labelledby="role-title" className="shadow-paper rounded-3xl bg-ink px-6 py-6 text-paper">
        <h2 id="role-title" className="eyebrow text-paper/65">
          Vai của bạn
        </h2>
        <p className="mt-2 text-[1.35rem] leading-snug">{intro.roleVi}</p>
        <div aria-hidden className="my-4 h-px bg-paper/15" />
        <h3 className="eyebrow text-paper/65">Góc nhìn</h3>
        <p className="mt-2 leading-relaxed text-paper/85">{intro.viewVi}</p>
      </section>

      <section aria-labelledby="howto-title">
        <h2 id="howto-title" className="text-[1.35rem] leading-snug">
          Cách đọc
        </h2>
        <ol className="mt-3 flex flex-col gap-2.5">
          {HOW_TO.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-2xl border border-line bg-card px-4 py-3">
              <span className="text-lg text-wine italic">{i + 1}.</span>
              <p className="leading-relaxed">
                <span className="font-bold">{step.title}.</span> {step.text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-muted italic">
          Truyện có {story.pages} trang, mỗi trang khoảng 5 phút. Đọc xong trang cuối, bạn sẽ tự viết đoạn kết ở{" "}
          <span translate="no">The Last Page</span>.
        </p>
      </section>

      <IntroStart storyId={story.id} totalPages={story.pages} />
    </div>
  );
}
