"use client";

import { useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { PageTurn } from "@/registry/ui/page-turn/page-turn";
import { Panel } from "@/registry/ui/panel/panel";

export default function PageTurnLeftToRightVariant() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid w-full max-w-sm gap-4">
      {/* A translated edition reads like a western book: the cover swings away to the left. */}
      <PageTurn pageKey={open ? "page-1" : "cover"} direction="ltr">
        {open ? (
          <Panel caption="Page 1" className="min-h-56">
            <p className="mt-auto w-fit bg-paper px-1 font-display text-2xl uppercase">
              The last bus leaves at midnight.
            </p>
          </Panel>
        ) : (
          <Panel tone="cross" className="min-h-56 items-center justify-center text-center">
            <p className="bg-paper px-2 font-display text-3xl uppercase">Night Bus</p>
            <p className="bg-paper px-1 text-sm">Volume 1, English edition</p>
          </Panel>
        )}
      </PageTurn>
      {/* Western order: back on the left, forward on the right. */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={!open} onClick={() => setOpen(false)}>
          ← Cover
        </Button>
        <span className="self-center text-sm" aria-live="polite">
          {open ? "Page 1" : "Cover"}
        </span>
        <Button variant="outline" disabled={open} onClick={() => setOpen(true)}>
          Open →
        </Button>
      </div>
    </div>
  );
}
