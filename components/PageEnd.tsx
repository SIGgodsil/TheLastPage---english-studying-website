import Link from "next/link";
import { lastPageHref, pageHref } from "@/lib/links";
import ShadowPractice from "./ShadowPractice";

type Props = {
  storyId: string;
  pageNumber: number;
  totalPages: number;
  /** Title of the next chat page, as a teaser. Undefined on the last chat page. */
  nextTitle?: string;
  /** This page's shadow line, offered once more before moving on. */
  shadow?: { nodeId: string; text: string; vi: string; names: string[] };
};

/** The "next page" screen shown under the cliffhanger. */
export default function PageEnd({ storyId, pageNumber, totalPages, nextTitle, shadow }: Props) {
  const isLast = pageNumber >= totalPages;
  return (
    <div className="flex flex-col items-center gap-3 py-1 text-center">
      <p className="eyebrow text-wine">
        Hết trang {pageNumber}/{totalPages}
      </p>
      <p className="-mt-1 text-lg text-muted italic">
        {isLast ? "Câu chuyện chưa kết thúc đâu…" : "Chuyện gì sẽ xảy ra tiếp theo?"}
      </p>

      {shadow && <ShadowPractice storyId={storyId} page={pageNumber} variant="wide" {...shadow} />}

      {isLast ? (
        <Link href={lastPageHref(storyId)} className="btn-primary w-full">
          <span>
            Lật sang <span className="italic">The Last Page</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <Link href={pageHref(storyId, pageNumber + 1)} className="btn-primary w-full">
          <span className="min-w-0">
            Đọc trang {pageNumber + 1}
            {nextTitle && <span className="font-normal italic">: {nextTitle}</span>}
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}
      <Link href="/" className="py-1 text-muted italic underline-offset-4 hover:text-ink hover:underline">
        Để sau, về trang chủ
      </Link>
    </div>
  );
}
