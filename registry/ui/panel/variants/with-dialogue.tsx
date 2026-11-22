import { Panel } from "@/registry/ui/panel/panel";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

export default function PanelWithDialogueVariant() {
  return (
    // Narration in the caption box, a character's line in a bubble: the two voices of a panel.
    <Panel
      tone="halftone"
      caption="Platform 4, the last train"
      className="min-h-64 w-full max-w-md justify-between"
    >
      <SpeechBubble aria-label="Ren" tail="bottom-right" className="self-end">
        You're late. Again.
      </SpeechBubble>
      <SpeechBubble aria-label="Aki" shape="shout" tail="top-left" className="self-start">
        The train was!
      </SpeechBubble>
    </Panel>
  );
}
