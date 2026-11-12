"use client";

import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/registry/ui/button/button";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/registry/ui/message-scroller/message-scroller";

const script = [
  "Panel 1: a quiet street at dawn.",
  "Panel 2: a door bursts open.",
  "Panel 3: BAM! The hero leaps out.",
  "Panel 4: the cat does not care.",
  "Panel 5: a bell rings across town.",
  "Panel 6: she looks up.",
  "Panel 7: the sky splits in two.",
  "Panel 8: to be continued.",
];

export default function MessageScrollerFollowDemo() {
  const [count, setCount] = React.useState(5);
  const done = count >= script.length;

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <MessageScrollerProvider autoScroll>
        <div className="relative isolate h-60 w-full">
          <InkFrame as="span" fill="paper" className="pointer-events-none absolute inset-0 -z-1" />
          <MessageScroller>
            <MessageScrollerViewport aria-label="Script">
              <MessageScrollerContent className="gap-2 p-4">
                {script.slice(0, count).map((line, index) => (
                  <MessageScrollerItem key={line} messageId={`panel-${index + 1}`}>
                    <div className="relative isolate rounded-lg px-3 py-2 text-sm">
                      <InkFrame
                        as="span"
                        fill="paper"
                        className="pointer-events-none absolute inset-0 -z-1"
                      />
                      {line}
                    </div>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </div>
      </MessageScrollerProvider>
      <div className="flex items-center gap-2">
        <Button disabled={done} onClick={() => setCount((value) => value + 1)}>
          Next panel
        </Button>
        <Button variant="outline" disabled={count === 5} onClick={() => setCount(5)}>
          Start over
        </Button>
      </div>
    </div>
  );
}
