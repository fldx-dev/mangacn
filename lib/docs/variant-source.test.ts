import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { listVariants } from "@/lib/registry/variants";
import {
  getVariantEntry,
  getVariantSource,
  rewriteVariantImports,
  variantInstallPaths,
} from "./variant-source";

describe("rewriteVariantImports", () => {
  it("rewrites a manga-native item (registry:component) to components/", () => {
    expect(
      rewriteVariantImports(
        'import { SpeechBubble } from "@/registry/ui/speech-bubble/speech-bubble";',
      ),
    ).toBe('import { SpeechBubble } from "@/components/speech-bubble";');
  });

  it("rewrites a primitive (registry:ui) to components/ui/", () => {
    expect(rewriteVariantImports("import { Button } from '@/registry/ui/button/button';")).toBe(
      "import { Button } from '@/components/ui/button';",
    );
  });

  it("maps every shipped file to its catalog target", () => {
    const paths = variantInstallPaths();
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
      rewriteVariantImports(
        'import { InkFrame } from "@/registry/theme/ink-frame/ink-frame";\n' +
          'import { popIn } from "@/registry/theme/manga-motion/manga-motion";',
      ),
    ).toBe(
      'import { InkFrame } from "@/components/ink-frame";\n' +
        'import { popIn } from "@/lib/manga-motion";',
    );
  });

  it("leaves variant-local helpers, packages and other repo paths as they are", () => {
    const source = [
      'import { portrait } from "./portrait";',
      'import { BookOpenIcon } from "lucide-react";',
      'import { Card } from "@/registry/ui/card/card-parts";',
    ].join("\n");
    expect(rewriteVariantImports(source)).toBe(source);
  });

  it("leaves no repo import in any variant", () => {
    for (const { item, variant } of listVariants()) {
      expect(getVariantSource(item, variant), `${item}/${variant}`).not.toMatch(/@\/registry\//);
    }
  });
});

describe("getVariantSource", () => {
  it("reads the variant from the variant map's path, with the rewritten import", () => {
    const source = getVariantSource("speech-bubble", "tails");
    expect(source).toContain('from "@/components/speech-bubble"');
    expect(source).toContain("export default function SpeechBubbleTailsVariant");
  });

  it("throws naming the item's variants for an unknown variant", () => {
    expect(() => getVariantEntry("speech-bubble", "nope")).toThrow(
      /Unknown variant "nope" for item "speech-bubble" \(variants: default, .*tails/,
    );
  });

  it("throws for an item without variants", () => {
    expect(() => getVariantSource("nope", "default")).toThrow(/Unknown item "nope"/);
  });
});
