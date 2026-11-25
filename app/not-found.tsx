import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-4xl" aria-hidden>
        🕯️
      </p>
      <h1 className="font-serif text-2xl font-semibold">Trang này đã biến mất…</h1>
      <p className="text-muted">Có lẽ nó chưa từng được viết. Hãy quay lại và chọn một câu chuyện khác nhé.</p>
      <Link href="/" className="mt-2 rounded-full bg-wine px-6 py-3 font-medium text-paper">
        Về trang chủ
      </Link>
    </main>
  );
}
