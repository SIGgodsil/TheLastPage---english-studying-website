// Vietnamese feedback copy for The Last Page (CONTEXT.md section 7):
// address the learner as "bạn", praise first, one suggestion at a time,
// never "Sai rồi!".

import type { ReactNode } from "react";
import { ENDING_TARGET } from "@/lib/ending";
import type { FixKind, Strengths } from "@/lib/feedback";

const En = ({ children }: { children: ReactNode }) => (
  <strong lang="en" className="font-bold text-wine">
    {children}
  </strong>
);

/** The praise that opens the feedback: what went well, before any suggestion. */
export function praiseLines(s: Strengths, fixCount: number): ReactNode[] {
  const lines: ReactNode[] = [];
  if (s.challenge) lines.push("Xuất sắc! Bạn đã hoàn thành thử thách B1 🏅");
  else if (s.count >= ENDING_TARGET.min) lines.push("Đoạn kết rất sáng tạo! ✨");
  else lines.push("Mở đầu hay lắm! ✨");

  if (s.used.length > 0) {
    const shown = s.used.slice(0, 5);
    lines.push(
      <>
        Bạn đã dùng {s.used.length} từ mới:{" "}
        {shown.map((w, i) => (
          <span key={w}>
            {i > 0 && ", "}
            <En>{w}</En>
          </span>
        ))}
        {s.used.length > shown.length && "…"}.
      </>,
    );
  }
  if (s.pattern) lines.push("Bạn còn dùng được mẫu câu của truyện nữa 👏");
  if (fixCount === 0) lines.push("Mình không thấy lỗi nào cả!");
  return lines;
}

/** What one suggestion is about, naming the words. */
export function fixMessage(kind: FixKind, flagged: string): ReactNode {
  switch (kind) {
    case "spelling":
      return (
        <>
          Từ <En>{flagged}</En> có thể viết chưa đúng chính tả.
        </>
      );
    case "grammar":
      return (
        <>
          Chỗ <En>{flagged}</En> có thể chưa đúng ngữ pháp.
        </>
      );
    case "word":
      return (
        <>
          Ở chỗ <En>{flagged}</En>, có thể bạn muốn dùng một từ khác.
        </>
      );
    case "capital":
      return /^i\b/.test(flagged) ? (
        <>
          Chữ <En>I</En> (tôi) luôn viết hoa.
        </>
      ) : (
        <>
          Chữ đầu câu cần viết hoa: <En>{flagged}</En>.
        </>
      );
    case "punctuation":
      return (
        <>
          Chú ý dấu câu ở chỗ <En>{flagged}</En>.
        </>
      );
    case "full-stop":
      return <>Nhớ thêm dấu chấm ở cuối đoạn nhé.</>;
    case "spacing":
      return <>Chỗ này có khoảng trắng chưa đúng.</>;
    case "repeat":
      return (
        <>
          Từ <En>{flagged.split(/\s+/)[0]}</En> bị lặp lại hai lần.
        </>
      );
  }
}

export type NoteKind = "length" | "words" | "pattern";

/** Gentle ideas after the corrections: write more, use the story's words, try the pattern. */
export function noteMessage(kind: NoteKind, s: Strengths, pattern: string): ReactNode {
  switch (kind) {
    case "length":
      return `Bạn có thể viết thêm khoảng ${ENDING_TARGET.min - s.count} từ nữa để đoạn kết trọn vẹn hơn.`;
    case "words":
      return "Thử dùng 1–2 từ trong kho từ bên dưới nhé. Đó là những từ bạn đã gặp trong truyện.";
    case "pattern":
      return (
        <>
          Thử dùng mẫu câu của truyện: <En>{pattern}</En>
        </>
      );
  }
}

export const CHECK_NOTE =
  "Khi bấm, bài viết sẽ được gửi tới dịch vụ soát lỗi miễn phí LanguageTool (languagetool.org).";
export const OFFLINE_NOTE =
  "Chưa kết nối được dịch vụ soát lỗi, nên đây mới là nhận xét cơ bản. Bạn có thể thử lại sau.";
