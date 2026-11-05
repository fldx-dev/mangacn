import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import { demoInstallPaths, getDemoEntry, getDemoSource, rewriteDemoImports } from "./demo-source";

describe("rewriteDemoImports", () => {
  it("rewrites a manga-native item (registry:component) to components/", () => {
    expect(
      rewriteDemoImports(
        'import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";',
      ),
    ).toBe('import { SpeechBubble } from "@/components/speech-bubble";');
  });

  it("rewrites a primitive (registry:ui) to components/ui/", () => {
    expect(rewriteDemoImports("import { Button } from '@/registry/ui/button/button';")).toBe(
      "import { Button } from '@/components/ui/button';",
    );
  });

  it("maps every shipped file to its catalog target", () => {
    const paths = demoInstallPaths();
    for (const item of loadRegistry().items) {
      for (const file of item.files) {
        const expected = item.type === "registry:ui" ? "@/components/ui/" : "@/";
        expect(paths.get(`@/${file.path.replace(/\.tsx?$/, "")}`), item.name).toMatch(
          new RegExp(`^${expected}`),
        );
      }
    }
    expect(paths.get("@/registry/ui/panel/panel")).toBe("@/components/panel");
    expect(paths.get("@/registry/ui/card/card")).toBe("@/components/ui/card");
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
    expect(source).toContain('from "@/components/speech-bubble"');
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
