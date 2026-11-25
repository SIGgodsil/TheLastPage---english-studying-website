import Link from "next/link";

type Props = { storyId: string; pageNumber: number; totalPages: number };

/** Shown after the cliffhanger. (MVP phase 5 turns this into the full "next page" screen.) */
export default function PageEnd({ storyId, pageNumber, totalPages }: Props) {
  const hasNext = pageNumber < totalPages;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="font-serif text-sm italic text-muted">
        — Hết trang {pageNumber}/{totalPages} —
      </p>
      {hasNext ? (
        <Link
          href={`/story/${storyId}/${pageNumber + 1}`}
          className="w-full rounded-full bg-wine px-6 py-3 font-medium text-paper transition active:scale-[0.98]"
        >
          Trang tiếp theo →
        </Link>
      ) : (
        <p className="w-full rounded-full border border-line px-6 py-3 text-muted">The Last Page · sắp có</p>
      )}
    </div>
  );
}
