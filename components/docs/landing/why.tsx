import type { ReactNode } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Emanata, type EmanataProps } from "@/registry/ui/emanata/emanata";
import { Panel, type PanelProps } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { SfxText } from "@/registry/ui/sfx-text/sfx-text";

interface Reason {
  key: string;
  tone: PanelProps["tone"];
  heading: ReactNode;
  mark: EmanataProps["kind"];
  body: string;
}

/** Section 5: three reasons, each a panel with its own screentone. */
export function Why({ primitives }: { primitives: number }) {
  const reasons: Reason[] = [
    {
      key: "hand-drawn",
      tone: "none",
      heading: (
        <SfxText size="sm" rotate={-4}>
          Hand-drawn
        </SfxText>
      ),
      mark: "sparkle",
      body: "Every outline is a rough.js stroke from InkFrame, seeded per element so it holds still between renders and redraws when the box resizes. No 2 px borders pretending.",
    },
    {
      key: "same-api",
      tone: "lines",
      heading: <Badge className="h-auto px-3 py-1.5 text-sm">Same API</Badge>,
      mark: "surprise",
      body: `The ${primitives} restyled primitives keep shadcn's exports, slots and variant names. A parity test checks them against stock base-nova in CI.`,
    },
    {
      key: "yours",
      tone: "halftone",
      heading: (
        <Badge variant="spot" className="h-auto px-3 py-1.5 text-sm">
          Yours
        </Badge>
      ),
      mark: "puff",
      body: "A shadcn registry under MIT. The CLI copies the source into your project, so you read it, change it and keep it.",
    },
  ];

  return (
    <section data-landing="why" aria-labelledby="landing-why" className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:py-20">
        <h2 id="landing-why" className="font-display text-3xl sm:text-4xl">
          Why it reads as manga
        </h2>
        <PanelGrid columns={{ base: 1, md: 3 }} gutter="lg">
          {reasons.map((reason) => (
            <PanelGridItem key={reason.key}>
              <Panel as="div" tone={reason.tone} className="gap-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="pt-1">{reason.heading}</h3>
                  <Emanata kind={reason.mark} decorative className="shrink-0" />
                </div>
                <p className="max-w-prose bg-paper/90 text-pretty">{reason.body}</p>
              </Panel>
            </PanelGridItem>
          ))}
        </PanelGrid>
      </div>
    </section>
  );
}
