import { cn } from "cn";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { installCommand } from "@/lib/docs/install-command";
import { CODE_WRAPS } from "../landing/fit";
import { SwapToggle } from "./swap-toggle";

const LINES = [
  installCommand("card", "npm"),
  installCommand("button", "npm"),
  installCommand("badge", "npm"),
  "",
  "// components/ui/card.tsx now draws itself.",
  "// Your imports and props did not change.",
];

/**
 * Section 4: the pitch as a toggle. Flip the switch and the same card is drawn by mangacn;
 * flip it back and it is stock again. The command beside it is all it takes.
 */
export function SwapImport() {
  return (
    <section data-landing="swap-import" aria-labelledby="alt-swap" className="border-b bg-tone-1">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="flex min-w-0 flex-col gap-5">
          <h2 id="alt-swap" className="font-display text-3xl text-balance sm:text-4xl lg:text-5xl">
            Swap an import. Keep your code.
          </h2>
          <p className="max-w-prose text-pretty text-lg">
            Every restyled primitive keeps shadcn's exports, slots and variant names. Install it
            over the stock file and the page you already built comes out inked.
          </p>
          <div className={cn("min-w-0", CODE_WRAPS)}>
            <CodeBlock
              className="my-0"
              viewportProps={{ "aria-label": "Swap an import: the three commands" }}
            >
              <Pre>
                <code>
                  {LINES.map((line, index) => (
                    <span key={line} className="line">
                      {line}
                      {index < LINES.length - 1 ? "\n" : null}
                    </span>
                  ))}
                </code>
              </Pre>
            </CodeBlock>
          </div>
        </div>
        <SwapToggle />
      </div>
    </section>
  );
}
