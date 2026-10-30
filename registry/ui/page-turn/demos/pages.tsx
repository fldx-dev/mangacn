"use client";

import { useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { PageTurn } from "@/registry/ui/page-turn/page-turn";
import { Panel } from "@/registry/ui/panel/panel";

const pages = [
  { caption: "Page 1", tone: "none", text: "The bell rings." },
  { caption: "Page 2", tone: "halftone", text: "Nobody moves." },
  { caption: "Page 3", tone: "lines", text: "Then everyone runs." },
] as const;

export default function PageTurnPagesDemo() {
  const [index, setIndex] = useState(0);
  const page = pages[index];
  return (
    <div className="grid w-full max-w-sm gap-4">
      <PageTurn pageKey={index}>
        <Panel caption={page.caption} tone={page.tone} className="min-h-48">
          <p className="mt-auto w-fit bg-paper px-1 font-display text-2xl uppercase">{page.text}</p>
        </Panel>
      </PageTurn>
      {/* Manga reads right to left, so "next" sits on the left. */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={index === pages.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          ← Next
        </Button>
        <span className="self-center text-sm" aria-live="polite">
          {index + 1} / {pages.length}
        </span>
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Back →
        </Button>
      </div>
    </div>
  );
}
