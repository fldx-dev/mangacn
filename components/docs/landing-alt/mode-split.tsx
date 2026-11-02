import { cn } from "cn";
import type * as React from "react";
import themeRegistry from "@/registry/theme/registry.json";
import { Badge } from "@/registry/ui/badge/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";
import { ButtonLink } from "../landing/button-link";
import { InkTeaser } from "../landing/ink-teaser";

type Mode = "light" | "dark";

const theme = themeRegistry.items.find((item) => item.name === "theme");

/** Every theme variable of `mode` as inline custom properties, so a half shows that mode. */
function modeStyle(mode: Mode): React.CSSProperties {
  const values = (theme?.cssVars?.[mode] ?? {}) as Record<string, string>;
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`--${name}`, value]),
  ) as React.CSSProperties;
}

const HALVES: { mode: Mode; label: string; line: string; greeting: string }[] = [
  { mode: "light", label: "Day", line: "屋上、夕暮れ。", greeting: "おはよう。" },
  { mode: "dark", label: "Night", line: "屋上、真夜中。", greeting: "おやすみ。" },
];

/**
 * Section 6: the page torn down the middle. The same card in daylight and at night, a slanted
 * seam between them, and the pen sliders under it.
 */
export function ModeSplit() {
  return (
    <section data-landing="mode-split" aria-labelledby="alt-modes" className="border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-14 sm:px-6 md:pt-20">
        <h2 id="alt-modes" className="font-display text-3xl sm:text-4xl lg:text-5xl">
          Day and night, one pen.
        </h2>
        <p className="max-w-prose text-pretty text-lg">
          At night the paper turns warm charcoal, not black, and the ink an off-white. Eight tokens
          and one red carry both.
        </p>
      </div>

      <div className="relative isolate mt-8 grid overflow-hidden md:grid-cols-2">
        {HALVES.map((half) => (
          <div
            key={half.mode}
            data-mode={half.mode}
            style={modeStyle(half.mode)}
            className={cn(
              "flex min-w-0 justify-center bg-paper px-4 py-12 text-ink sm:px-6 md:py-16",
              half.mode === "dark" &&
                "dark md:-ml-[10%] md:w-[110%] md:pl-[12%] md:[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]",
            )}
          >
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant={half.mode === "dark" ? "outline" : "secondary"}>
                    {half.label}
                  </Badge>
                </CardDescription>
                <CardTitle lang="ja" className="font-display text-3xl">
                  第12話
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-5">
                <p lang="ja" className="font-dialogue text-lg">
                  {half.line}
                </p>
                <SpeechBubble lang="ja" className="text-sm">
                  {half.greeting}
                </SpeechBubble>
                <ButtonLink href="/docs/theming" size="sm">
                  Theming guide
                </ButtonLink>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <InkTeaser />
        </div>
      </div>
    </section>
  );
}
