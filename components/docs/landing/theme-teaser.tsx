import Link from "next/link";
import type * as React from "react";
import themeRegistry from "@/registry/theme/registry.json";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { TokenSwatches } from "../token-swatches";
import { ButtonLink } from "./button-link";
import { InkTeaser } from "./ink-teaser";

type Mode = "light" | "dark";

const theme = themeRegistry.items.find((item) => item.name === "theme");

/** Every theme variable of `mode` as inline custom properties, so a box shows that mode. */
function modeStyle(mode: Mode): React.CSSProperties {
  const values = (theme?.cssVars?.[mode] ?? {}) as Record<string, string>;
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`--${name}`, value]),
  ) as React.CSSProperties;
}

/** Section 6: the tokens, a light and a dark card side by side, and two live pen sliders. */
export function ThemeTeaser() {
  return (
    <section data-landing="theme" aria-labelledby="landing-theme" className="border-t bg-tone-1">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:items-center">
        <div className="flex min-w-0 flex-col gap-5">
          <h2 id="landing-theme" className="font-display text-3xl sm:text-4xl">
            Ink on paper, in two modes
          </h2>
          <p className="max-w-prose text-pretty">
            Eight tokens and one red. At night the paper turns warm charcoal, not black, and the ink
            an off-white. The pen is tunable too: drag the sliders and the frame redraws.
          </p>
          <InkTeaser />
          <Link
            href="/docs/theming"
            className="self-start font-medium underline underline-offset-4 hover:text-spot"
          >
            Theming guide →
          </Link>
        </div>
        <div className="grid min-w-0 gap-6 sm:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => (
            <div
              key={mode}
              style={modeStyle(mode)}
              className={
                mode === "dark" ? "dark rounded-xl bg-paper p-4" : "rounded-xl bg-paper p-4"
              }
            >
              <Card data-mode={mode} className="h-full text-ink">
                <CardHeader>
                  <CardDescription>{mode === "light" ? "Light" : "Dark"}</CardDescription>
                  <CardTitle lang="ja" className="font-display text-3xl">
                    第12話
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-4">
                  <p lang="ja" className="font-dialogue text-lg">
                    屋上、夕暮れ。
                  </p>
                  <ButtonLink
                    href={mode === "light" ? "/docs/theming#tokens" : "/docs/theming#dark-mode"}
                    size="sm"
                  >
                    {mode === "light" ? "The tokens" : "Dark mode"}
                  </ButtonLink>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <div className="min-w-0 lg:col-span-2">
          <TokenSwatches />
        </div>
      </div>
    </section>
  );
}
