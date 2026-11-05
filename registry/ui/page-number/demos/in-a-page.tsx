import { PageNumber } from "@/registry/ui/page-number/page-number";
import { Panel } from "@/registry/ui/panel/panel";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";

export default function PageNumberInAPageDemo() {
  return (
    // The panel is `relative`, so the folio sits in its bottom-right corner, inside the frame.
    <Panel className="min-h-64 w-full max-w-md items-center justify-center">
      <SpeechBubble lang="ja" aria-label="Aki">
        続きは、次のページで。
      </SpeechBubble>
      <PageNumber
        page={7}
        of={24}
        chapter={<span lang="ja">第12話</span>}
        className="absolute right-4 bottom-3"
      />
    </Panel>
  );
}
