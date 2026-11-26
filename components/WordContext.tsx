"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { track } from "@/lib/daily";
import type { PageWords, WordInfo } from "@/lib/dictionary";
import type { Glossary } from "@/lib/vocab";
import { markWordTipSeen } from "@/lib/storage";
import WordPopover from "./WordPopover";

type WordContextValue = {
  /** Surface form → dictionary key, for every word on this page. */
  lookup: (form: string) => string | undefined;
  /** Show the meaning of a tapped word next to it. */
  openWord: (shown: string, key: string, anchor: HTMLElement) => void;
};

const WordContext = createContext<WordContextValue | null>(null);

/** Word lookup for the text on screen, or null outside a chat. */
export function useWords(): WordContextValue | null {
  return useContext(WordContext);
}

type Props = {
  glossary: Glossary;
  words: PageWords;
  pageNumber: number;
  /** Called the first time the learner opens a word (to hide the tip). */
  onFirstWord?: () => void;
  children: ReactNode;
};

type Open = { shown: string; key: string; anchor: HTMLElement };

/** Makes every known word inside `children` tappable and shows its meaning in a popover. */
export function WordProvider({ glossary, words, pageNumber, onFirstWord, children }: Props) {
  const [open, setOpen] = useState<Open | null>(null);

  const openWord = useCallback(
    (shown: string, key: string, anchor: HTMLElement) => {
      setOpen({ shown, key, anchor });
      track("word");
      markWordTipSeen();
      onFirstWord?.();
    },
    [onFirstWord],
  );
  const closeWord = useCallback(() => setOpen(null), []);
  const value = useMemo(
    () => ({ lookup: (form: string) => words.forms[form], openWord }),
    [words, openWord],
  );

  // A marked key word uses the story glossary; any other word, the page's dictionary entries.
  const entry: WordInfo | undefined = open ? (glossary[open.key] ?? words.entries[open.key]) : undefined;

  return (
    <WordContext.Provider value={value}>
      {children}
      {open && (
        <WordPopover
          key={`${open.key}:${open.shown}`}
          shown={open.shown}
          wordKey={open.key}
          entry={entry}
          anchor={open.anchor}
          pageNumber={pageNumber}
          onClose={closeWord}
        />
      )}
    </WordContext.Provider>
  );
}
