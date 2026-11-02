"use client";

import { ArrowRight } from "lucide-react";
import { createContext, type ReactNode, use, useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { PageTurn } from "@/registry/ui/page-turn/page-turn";

const TurnContext = createContext<{ turn: () => void; turned: boolean } | null>(null);
/** The number of the page a component sits on; the turning page keeps its own while it exits. */
const PageNumberContext = createContext(0);

export interface TurningPageProps {
  /** The pages, shown in turn and then from the start again. */
  pages: ReactNode[];
  /** The number printed on the first page. */
  first: number;
}

/** `PageTurn` over `pages`, turned by a `TurnPageButton` placed on the page itself. */
export function TurningPage({ pages, first }: TurningPageProps) {
  const [turns, setTurns] = useState(0);
  const [context] = useState(() => ({ turn: () => setTurns((count) => count + 1) }));
  const number = first + turns;
  return (
    <TurnContext value={{ ...context, turned: turns > 0 }}>
      <PageTurn pageKey={turns} className="w-full">
        <PageNumberContext value={number}>{pages[turns % pages.length]}</PageNumberContext>
      </PageTurn>
      <p aria-live="polite" className="sr-only">
        {turns > 0 ? `Page ${number}` : ""}
      </p>
    </TurnContext>
  );
}

/** "p. 7": the number of the page it is printed on. */
export function PageNumber() {
  return <>p. {use(PageNumberContext)}</>;
}

/** Turns the page. The copy on the new page takes focus, so the keyboard stays on the button. */
export function TurnPageButton() {
  const context = use(TurnContext);
  if (!context) throw new Error("TurnPageButton must be used inside a TurningPage.");
  const ref = useRef<HTMLButtonElement>(null);
  const { turn, turned } = context;
  // Runs once per mount: the button on a page that just turned in takes over from the old one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the mount matters
  useEffect(() => {
    if (turned) ref.current?.focus();
  }, []);
  return (
    <Button ref={ref} type="button" variant="outline" onClick={turn} className="shrink-0">
      Turn page <ArrowRight aria-hidden />
    </Button>
  );
}
