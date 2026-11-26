"use client";

import { useState } from "react";
import StoryText from "./StoryText";
import TranslateButton from "./TranslateButton";

type Props = { text: string; vi?: string; accent?: boolean };

/** A short scene line between messages: centred, italic, muted, no bubble. */
export default function NarrationLine({ text, vi, accent }: Props) {
  const [showVi, setShowVi] = useState(false);
  return (
    <div className="mx-auto flex max-w-[85%] flex-col items-center py-2 text-center">
      {accent && <span aria-hidden className="mb-2 h-px w-10 bg-wine/40" />}
      <p className={`leading-relaxed italic ${accent ? "text-xl text-wine" : "text-[1.02rem] text-muted"}`}>
        <StoryText text={text} />
      </p>
      {vi && showVi && <p className="mt-1 text-sm text-muted">{vi}</p>}
      {vi && <TranslateButton shown={showVi} onToggle={() => setShowVi(!showVi)} />}
    </div>
  );
}
