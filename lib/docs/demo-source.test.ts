import { describe, expect, it } from "vitest";
import { listDemos } from "@/lib/registry/demos";
import { getDemoEntry, getDemoSource, rewriteDemoImports } from "./demo-source";

describe("rewriteDemoImports", () => {
  it("rewrites item imports to the install path", () => {
    expect(
      rewriteDemoImports(
        'import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";\n' +
          "import { Button } from '@/registry/ui/button/button';",
      ),
    ).toBe(
      'import { SpeechBubble } from "@/components/ui/speech-bubble";\n' +
        "import { Button } from '@/components/ui/button';",
    );
  });

  it("rewrites the theme items to their own targets", () => {
    expect(
      rewriteDemoImports(
        'import { InkFrame } from "@/registry/theme/ink-frame/ink-frame";\n' +
          'import { popIn } from "@/registry/theme/manga-motion/manga-motion";',
      ),
    ).toBe(
      'import { InkFrame } from "@/components/ink-frame";\n' +
        'import { popIn } from "@/lib/manga-motion";',
    );
  });

  it("leaves demo-local helpers, packages and other repo paths as they are", () => {
    const source = [
      'import { portrait } from "./portrait";',
      'import { BookOpenIcon } from "lucide-react";',
      'import { Card } from "@/registry/ui/card/card-parts";',
    ].join("\n");
    expect(rewriteDemoImports(source)).toBe(source);
  });

  it("leaves no repo import in any demo", () => {
    for (const { item, demo } of listDemos()) {
      expect(getDemoSource(item, demo), `${item}/${demo}`).not.toMatch(/@\/registry\//);
    }
  });
});

describe("getDemoSource", () => {
  it("reads the demo from the demo map's path, with the rewritten import", () => {
    const source = getDemoSource("speech-bubble", "tails");
    expect(source).toContain('from "@/components/ui/speech-bubble"');
    expect(source).toContain("export default function SpeechBubbleTailsDemo");
  });

  it("throws naming the item's demos for an unknown demo", () => {
    expect(() => getDemoEntry("speech-bubble", "nope")).toThrow(
      /Unknown demo "nope" for item "speech-bubble" \(demos: default, .*tails/,
    );
  });

  it("throws for an item without demos", () => {
    expect(() => getDemoSource("nope", "default")).toThrow(/Unknown item "nope"/);
  });
});
