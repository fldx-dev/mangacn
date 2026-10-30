import { ThoughtBubble } from "@/registry/ui/thought-bubble/thought-bubble";

export default function ThoughtBubbleVariantsDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-wrap items-start justify-center gap-8">
      <ThoughtBubble dots={1}>One dot.</ThoughtBubble>
      <ThoughtBubble dots={3}>Three dots, a longer pause.</ThoughtBubble>
      <ThoughtBubble tailSide="right">Trailing right.</ThoughtBubble>
      <ThoughtBubble font="inherit" tailSide="right" dots={3}>
        In the page font.
      </ThoughtBubble>
    </div>
  );
}
