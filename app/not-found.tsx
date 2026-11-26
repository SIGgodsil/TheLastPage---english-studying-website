import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="eyebrow text-muted">Lỗi 404</p>
      <h1 className="mt-3 text-3xl leading-tight">Trang này đã biến mất…</h1>
      <div aria-hidden className="mt-4 w-16 border-t border-ink" />
      <p className="mt-4 text-muted italic">Có lẽ nó chưa từng được viết. Hãy quay lại và chọn một câu chuyện khác nhé.</p>
      <Link href="/" className="btn-primary mt-7">
        Về trang chủ
      </Link>
    </main>
  );
}
