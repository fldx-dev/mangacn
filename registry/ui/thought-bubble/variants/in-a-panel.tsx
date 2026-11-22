import { Panel } from "@/registry/ui/panel/panel";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { ThoughtBubble } from "@/registry/ui/thought-bubble/thought-bubble";

export default function ThoughtBubbleInAPanelVariant() {
  return (
    // What she says and what she thinks, side by side in one panel; on a phone they stack.
    <Panel caption="The editor's office" className="w-full max-w-2xl">
      <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-2">
        <SpeechBubble aria-label="Aki says" tail="bottom-right">
          The pages are nearly done!
        </SpeechBubble>
        <ThoughtBubble aria-label="Aki thinks" dots={3}>
          I haven't inked a single one.
        </ThoughtBubble>
      </div>
    </Panel>
  );
}
