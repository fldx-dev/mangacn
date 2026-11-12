import { Bubble, BubbleContent } from "@/registry/ui/bubble/bubble";

export default function BubbleDefaultDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Bubble variant="secondary">
        <BubbleContent>Is the storyboard for chapter 12 done?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Inking the last panel now. Pages tonight.</BubbleContent>
      </Bubble>
    </div>
  );
}
