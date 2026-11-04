import { CaptionBox } from "@/registry/ui/caption-box/caption-box";
import { HalftoneBackground } from "@/registry/ui/halftone-background/halftone-background";
import { Panel } from "@/registry/ui/panel/panel";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

export default function CaptionBoxInAPanelDemo() {
  return (
    // The panel is `relative`, so each caption box sits on one of its corners.
    <Panel className="min-h-64 w-full max-w-md items-center justify-center">
      <HalftoneBackground fade="bottom" className="inset-(--outline-width-heavy)" />
      <CaptionBox corner="top-left">Tokyo, 3 a.m.</CaptionBox>
      <SpeechBubble aria-label="Aki">Still awake?</SpeechBubble>
      <CaptionBox corner="bottom-right" tone="tone" font="body">
        Twelve hours to the deadline.
      </CaptionBox>
    </Panel>
  );
}
