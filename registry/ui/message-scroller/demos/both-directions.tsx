"use client";

import { InkFrame } from "@/components/ink-frame";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/registry/ui/message-scroller/message-scroller";

const log = [
  "Chapter 1: The boy on the roof",
  "Chapter 2: A letter with no stamp",
  "Chapter 3: Night market",
  "Chapter 4: The second bell",
  "Chapter 5: Ink on her sleeve",
  "Chapter 6: Under the bridge",
  "Chapter 7: The rival's notebook",
  "Chapter 8: Rain delay",
  "Chapter 9: Four panels, one page",
  "Chapter 10: The splash",
  "Chapter 11: Deadline",
  "Chapter 12: To be continued",
];

export default function MessageScrollerBothDirectionsDemo() {
  return (
    <MessageScrollerProvider defaultScrollPosition="start">
      <div className="relative isolate h-72 w-full max-w-sm">
        <InkFrame as="span" fill="paper" className="pointer-events-none absolute inset-0 -z-1" />
        <MessageScroller>
          <MessageScrollerViewport aria-label="Reading history">
            <MessageScrollerContent className="gap-2 p-4">
              {log.map((title, index) => (
                <MessageScrollerItem key={title} messageId={`chapter-${index + 1}`}>
                  <div className="relative isolate rounded-lg px-3 py-2 text-sm">
                    <InkFrame
                      as="span"
                      fill="paper"
                      className="pointer-events-none absolute inset-0 -z-1"
                    />
                    {title}
                  </div>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="start" />
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  );
}
