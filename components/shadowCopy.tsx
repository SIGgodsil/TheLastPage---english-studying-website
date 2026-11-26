// Vietnamese feedback copy for shadowing (CONTEXT.md section 7):
// address the learner as "bạn", praise first, one correction at a time,
// never "Sai rồi!".

import type { ReactNode } from "react";
import type { ShadowResult, TipKind } from "@/lib/shadow";
import type { RecognitionFailure } from "@/lib/speech";

export const PRAISE: Record<ShadowResult["tier"], string> = {
  great: "Tuyệt vời! Phát âm rất rõ 👏",
  good: "Khá lắm! Bạn nói được gần hết câu rồi 👍",
  retry: "Thử lại nhé, bạn sắp được rồi!",
  silent: "Mình chưa nghe thấy gì. Bạn thử nói to và gần micro hơn nhé.",
};

const Word = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-wine">{children}</strong>;

/** The one correction, naming the word. */
export function tipMessage(kind: TipKind, word: string, gentle: boolean): ReactNode {
  const lead = gentle ? "Một gợi ý nhỏ: " : "";
  switch (kind) {
    case "ending":
      return (
        <>
          {lead}Thử nói rõ âm cuối của từ <Word>{word}</Word> nhé.
        </>
      );
    case "th":
      return (
        <>
          {lead}Chú ý âm <Word>th</Word> trong từ <Word>{word}</Word>: đặt nhẹ đầu lưỡi giữa hai hàm răng.
        </>
      );
    case "word":
      return (
        <>
          {lead}Thử nói rõ từ <Word>{word}</Word> nhé.
        </>
      );
  }
}

/** Why listening did not work, said kindly. */
export const FAILURE: Record<Exclude<RecognitionFailure, "aborted">, string> = {
  unsupported: "Trình duyệt này chưa hỗ trợ ghi âm. Bạn có thể bỏ qua hoặc mở bằng Chrome.",
  denied: "Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này trong cài đặt trình duyệt, rồi thử lại nhé.",
  "no-mic": "Không tìm thấy micro. Bạn kiểm tra lại micro rồi thử lại nhé.",
  "no-audio":
    "Micro chưa bật lên được. Bạn xem trình duyệt đã được phép dùng micro chưa (biểu tượng 🎙️ trên thanh địa chỉ), rồi thử lại nhé.",
  quiet:
    "Micro đã bật nhưng chưa thu được tiếng nào. Có thể trình duyệt đang dùng nhầm micro: bấm biểu tượng 🎙️ trên thanh địa chỉ để chọn đúng micro, hoặc kiểm tra micro trong cài đặt của máy nhé.",
  unclear:
    "Mình nghe thấy tiếng bạn nhưng chưa nhận ra từ nào. Bạn thử nói chậm, rõ và gần micro hơn nhé. Trình duyệt cần mạng để nhận giọng nói, nên bạn kiểm tra cả kết nối mạng nữa.",
  "no-reply":
    "Micro đã thu được giọng bạn, nhưng dịch vụ nhận giọng nói của trình duyệt không trả lời. Thường là do trình duyệt (Cốc Cốc, Brave, Opera… không có dịch vụ này) hoặc do VPN, tường lửa chặn. Bạn thử mở bằng Chrome hoặc Edge, và tắt VPN nếu đang bật nhé.",
  network: "Chưa kết nối được dịch vụ nhận giọng nói của trình duyệt. Bạn kiểm tra mạng rồi thử lại nhé.",
  error: "Có chút trục trặc khi ghi âm. Bạn thử lại nhé.",
};
