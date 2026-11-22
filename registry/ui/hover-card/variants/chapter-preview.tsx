import { InkFrame } from "@/components/ink-frame";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/ui/hover-card/hover-card";

const preview = {
  n: 12,
  title: "Rooftop",
  pages: 18,
  summary: "Ren takes the shortcut over the station roof, and someone is waiting there.",
};

export default function HoverCardChapterPreviewVariant() {
  return (
    <ul className="grid gap-2 text-sm">
      <li>
        <a href="#chapter-11" className="underline underline-offset-4">
          Chapter 11 · Paper Moon
        </a>
      </li>
      <li>
        <HoverCard defaultOpen>
          <HoverCardTrigger
            href={`#chapter-${preview.n}`}
            className="font-medium underline underline-offset-4"
          >
            Chapter {preview.n} · {preview.title}
          </HoverCardTrigger>
          <HoverCardContent side="right" align="start">
            <div className="flex gap-3">
              <InkFrame
                fill="tone"
                aria-hidden="true"
                className="flex aspect-[3/4] w-14 shrink-0 items-center justify-center rounded-md font-display text-lg text-ink"
              >
                {preview.n}
              </InkFrame>
              <div className="grid min-w-0 content-start gap-1">
                <p className="font-medium">{preview.title}</p>
                <p className="text-muted-foreground">{preview.summary}</p>
                <p className="text-xs text-muted-foreground">{preview.pages} pages</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </li>
      <li>
        <a href="#chapter-13" className="underline underline-offset-4">
          Chapter 13 · Last Train
        </a>
      </li>
    </ul>
  );
}
