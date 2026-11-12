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

const thread = [
  ["Editor", "Pages 1 to 8 are in. The rooftop chase reads fast."],
  ["Artist", "Thanks! I redrew the second panel on page 4."],
  ["Editor", "The new angle works. Can the SFX on page 5 be bigger?"],
  ["Artist", "Sure, I'll take it across the gutter."],
  ["Editor", "Page 6: the caption box covers her hand."],
  ["Artist", "Moving it to the top left corner."],
  ["Editor", "Page 7 is perfect. Leave it as it is."],
  ["Artist", "Screentone on the sky, or keep it white?"],
  ["Editor", "Tone, the lighter one. Night is coming."],
  ["Artist", "Done. Uploading pages 9 and 10 now."],
  ["Editor", "Got them. Page 10's splash is the chapter."],
  ["Artist", "Lettering tomorrow, then it goes to print."],
] as const;

export default function MessageScrollerDefaultDemo() {
  return (
    <MessageScrollerProvider>
      <div className="relative isolate h-80 w-full max-w-sm">
        <InkFrame as="span" fill="paper" className="pointer-events-none absolute inset-0 -z-1" />
        <MessageScroller>
          <MessageScrollerViewport aria-label="Chapter 12 notes">
            <MessageScrollerContent className="gap-3 p-4">
              {thread.map(([speaker, text], index) => (
                <MessageScrollerItem
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed script
                  key={index}
                  messageId={`note-${index}`}
                  className={speaker === "Artist" ? "ms-8" : "me-8"}
                >
                  <div className="relative isolate flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm">
                    <InkFrame
                      as="span"
                      fill={speaker === "Artist" ? "tone" : "paper"}
                      className="pointer-events-none absolute inset-0 -z-1"
                    />
                    <span className="text-xs font-semibold">{speaker}</span>
                    {text}
                  </div>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  );
}
