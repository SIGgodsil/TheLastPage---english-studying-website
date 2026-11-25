"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Glossary } from "@/lib/vocab";
import WordSheet from "./WordSheet";

type WordContextValue = {
  glossary: Glossary;
  /** Open the word sheet for a tapped vocab word. */
  openWord: (shown: string, key: string) => void;
};

const WordContext = createContext<WordContextValue | null>(null);

/** The glossary and word sheet for the words on screen, or null outside a chat. */
export function useWords(): WordContextValue | null {
  return useContext(WordContext);
}

type Props = { glossary: Glossary; pageNumber: number; children: ReactNode };

/** Makes vocab words tappable inside `children` and shows the word sheet. */
export function WordProvider({ glossary, pageNumber, children }: Props) {
  const [word, setWord] = useState<{ shown: string; key: string } | null>(null);
  const value = useMemo(
    () => ({ glossary, openWord: (shown: string, key: string) => setWord({ shown, key }) }),
    [glossary],
  );

  return (
    <WordContext.Provider value={value}>
      {children}
      <WordSheet
        shown={word?.shown}
        wordKey={word?.key}
        entry={word ? glossary[word.key] : undefined}
        pageNumber={pageNumber}
        onClose={() => setWord(null)}
      />
    </WordContext.Provider>
  );
}
