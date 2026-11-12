"use client";

import { Bubble, BubbleContent, BubbleGroup } from "@/registry/ui/bubble/bubble";

export default function BubbleVariantsDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Bubble align="end">
        <BubbleContent>Can you check page 14 before I send it?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="ghost">
          <BubbleContent>Checked. Three notes:</BubbleContent>
        </Bubble>
        <Bubble variant="tinted">
          <BubbleContent>Panel 2: the rain screentone runs into the gutter.</BubbleContent>
        </Bubble>
        <Bubble variant="outline">
          <BubbleContent>Panel 4: the SFX covers Ren's face.</BubbleContent>
        </Bubble>
        <Bubble variant="destructive">
          <BubbleContent>Panel 5 is missing from the export.</BubbleContent>
        </Bubble>
      </BubbleGroup>
      <BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent>Hana joined the chat.</BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent render={<button type="button" />}>Open page 14</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}
