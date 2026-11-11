import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Shipped items import InkFrame from its install path; tsconfig.json maps it the same way.
    alias: [
      {
        find: /^@\/components\/ink-frame$/,
        replacement: fileURLToPath(
          new URL("./registry/theme/ink-frame/ink-frame.tsx", import.meta.url),
        ),
      },
      // Items import their registryDependencies from the install path too (dialog → button,
      // toggle-group → toggle, sfx-ticker → sfx-text, menubar → dropdown-menu).
      {
        find: /^@\/components\/ui\/button$/,
        replacement: fileURLToPath(new URL("./registry/ui/button/button.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/toggle$/,
        replacement: fileURLToPath(new URL("./registry/ui/toggle/toggle.tsx", import.meta.url)),
      },
      // input-group → input, textarea.
      {
        find: /^@\/components\/ui\/input$/,
        replacement: fileURLToPath(new URL("./registry/ui/input/input.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/textarea$/,
        replacement: fileURLToPath(new URL("./registry/ui/textarea/textarea.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/dropdown-menu$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/dropdown-menu/dropdown-menu.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/sfx-text$/,
        replacement: fileURLToPath(new URL("./registry/ui/sfx-text/sfx-text.tsx", import.meta.url)),
      },
      // Blocks import the items they declare from the install paths (chapter-list → separator,
      // caption-box, ink-mark, stamp).
      {
        find: /^@\/components\/ui\/separator$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/separator/separator.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/caption-box$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/caption-box/caption-box.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/ink-mark$/,
        replacement: fileURLToPath(new URL("./registry/ui/ink-mark/ink-mark.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/stamp$/,
        replacement: fileURLToPath(new URL("./registry/ui/stamp/stamp.tsx", import.meta.url)),
      },
      // field → label.
      {
        find: /^@\/components\/ui\/label$/,
        replacement: fileURLToPath(new URL("./registry/ui/label/label.tsx", import.meta.url)),
      },
      // chapter-list → item (each row).
      {
        find: /^@\/components\/ui\/item$/,
        replacement: fileURLToPath(new URL("./registry/ui/item/item.tsx", import.meta.url)),
      },
      // spread-viewer → kbd, manga-frame, page-number, page-turn (button is above).
      {
        find: /^@\/components\/ui\/kbd$/,
        replacement: fileURLToPath(new URL("./registry/ui/kbd/kbd.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/manga-frame$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/manga-frame/manga-frame.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/page-number$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/page-number/page-number.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/page-turn$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/page-turn/page-turn.tsx", import.meta.url),
        ),
      },
      // empty → emanata (the default media mark).
      {
        find: /^@\/components\/emanata$/,
        replacement: fileURLToPath(new URL("./registry/ui/emanata/emanata.tsx", import.meta.url)),
      },
      // sidebar → sheet, skeleton, tooltip (button, input and separator are above).
      {
        find: /^@\/components\/ui\/sheet$/,
        replacement: fileURLToPath(new URL("./registry/ui/sheet/sheet.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/skeleton$/,
        replacement: fileURLToPath(new URL("./registry/ui/skeleton/skeleton.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/tooltip$/,
        replacement: fileURLToPath(new URL("./registry/ui/tooltip/tooltip.tsx", import.meta.url)),
      },
      // chart → card (its tooltip box).
      {
        find: /^@\/components\/ui\/card$/,
        replacement: fileURLToPath(new URL("./registry/ui/card/card.tsx", import.meta.url)),
      },
      // sidebar → use-mobile (the hook catalog's one file per hook).
      {
        find: /^@\/hooks\/use-mobile$/,
        replacement: fileURLToPath(new URL("./registry/hooks/use-mobile.ts", import.meta.url)),
      },
      // command → dialog.
      {
        find: /^@\/components\/ui\/dialog$/,
        replacement: fileURLToPath(new URL("./registry/ui/dialog/dialog.tsx", import.meta.url)),
      },
      // combobox, command → input-group.
      {
        find: /^@\/components\/ui\/input-group$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/input-group/input-group.tsx", import.meta.url),
        ),
      },
      // character-card and volume-grid (Task 94).
      {
        find: /^@\/components\/speech-bubble$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/speech-bubble/speech-bubble.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/power-gauge$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/power-gauge/power-gauge.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/panel-grid$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/panel-grid/panel-grid.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/ui\/aspect-ratio$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/aspect-ratio/aspect-ratio.tsx", import.meta.url),
        ),
      },
      { find: "@", replacement: fileURLToPath(new URL("./", import.meta.url)) },
    ],
  },
  test: {
    environment: "jsdom",
    // Each test file still gets its own context (stubbed globals stay per file), but the worker
    // keeps one jsdom per thread instead of building it for every file: measured on CI in Task 67.
    pool: "vmThreads",
    // Locally, parallel sessions can saturate the CPU and workers then time out on start-up;
    // CI runners are quiet, so they keep the default.
    ...(process.env.CI ? {} : { maxWorkers: "50%" }),
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "registry/**/*.test.{ts,tsx}",
      "lib/**/*.test.ts",
      "components/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
    ],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["lib/registry/**"],
      exclude: [
        "lib/registry/**/*.test.ts",
        "lib/registry/**/__snapshots__/**",
        "lib/registry/**/*.generated.ts",
        "lib/registry/__fixtures__/**",
      ],
      reporter: ["text"],
      thresholds: {
        lines: 90,
      },
    },
  },
});
