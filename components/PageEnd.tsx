import Link from "next/link";
import { lastPageHref, pageHref } from "@/lib/links";

type Props = {
  storyId: string;
  pageNumber: number;
  totalPages: number;
  /** Title of the next chat page, as a teaser. Undefined on the last chat page. */
  nextTitle?: string;
};

/** The "next page" screen shown under the cliffhanger. */
export default function PageEnd({ storyId, pageNumber, totalPages, nextTitle }: Props) {
  const isLast = pageNumber >= totalPages;
  return (
    <div className="flex flex-col items-center gap-3 py-1 text-center">
      <div className="flex items-center gap-1.5" aria-label={`Đã đọc ${pageNumber}/${totalPages} trang`} role="img">
        {Array.from({ length: totalPages }, (_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i < pageNumber ? "bg-wine" : "bg-line"}`} />
        ))}
        <span className={`ml-1 text-sm ${isLast ? "text-wine" : "text-line"}`} aria-hidden>
          ✍️
        </span>
      </div>
      <p className="font-serif italic text-muted">
        Hết trang {pageNumber}. {isLast ? "Câu chuyện chưa kết thúc đâu…" : "Chuyện gì sẽ xảy ra tiếp theo?"}
      </p>

      {isLast ? (
        <Link
          href={lastPageHref(storyId)}
          className="w-full rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
        >
          Lật sang <span className="font-serif italic">The Last Page</span> →
        </Link>
      ) : (
        <Link
          href={pageHref(storyId, pageNumber + 1)}
          className="w-full rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
        >
          Đọc trang {pageNumber + 1}
          {nextTitle && <span className="font-serif italic">: {nextTitle}</span>} →
        </Link>
      )}
      <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">
        Để sau, về trang chủ
      </Link>
    </div>
  );
}
