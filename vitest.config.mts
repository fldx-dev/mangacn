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
      // code-block → use-highlighted-code, and the hook → its lib companion.
      {
        find: /^@\/hooks\/use-highlighted-code$/,
        replacement: fileURLToPath(
          new URL("./registry/hooks/use-highlighted-code.ts", import.meta.url),
        ),
      },
      {
        find: /^@\/lib\/highlighter$/,
        replacement: fileURLToPath(
          new URL("./registry/hooks/lib/highlighter.tsx", import.meta.url),
        ),
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
      // reader (Task 95): its items, and the blocks it composes at their install paths.
      {
        find: /^@\/components\/ui\/drawer$/,
        replacement: fileURLToPath(new URL("./registry/ui/drawer/drawer.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/progress$/,
        replacement: fileURLToPath(new URL("./registry/ui/progress/progress.tsx", import.meta.url)),
      },
      // login-01 (Task 98): field, and the page's own form at its install path.
      {
        find: /^@\/components\/ui\/field$/,
        replacement: fileURLToPath(new URL("./registry/ui/field/field.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/login-form$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/login-01/components/login-form.tsx", import.meta.url),
        ),
      },
      // signup-01 (Task 104): the page's own form at its install path.
      {
        find: /^@\/components\/signup-form$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/signup-01/components/signup-form.tsx", import.meta.url),
        ),
      },
      // sidebar-07 (Task 105): its items, and the page's five component files at their install
      // paths (the components import each other relatively; the page reaches app-sidebar).
      {
        find: /^@\/components\/ui\/sidebar$/,
        replacement: fileURLToPath(new URL("./registry/ui/sidebar/sidebar.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/breadcrumb$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/breadcrumb/breadcrumb.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/ui\/collapsible$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/collapsible/collapsible.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/ui\/avatar$/,
        replacement: fileURLToPath(new URL("./registry/ui/avatar/avatar.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/panel$/,
        replacement: fileURLToPath(new URL("./registry/ui/panel/panel.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/app-sidebar$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/sidebar-07/components/app-sidebar.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/nav-main$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/sidebar-07/components/nav-main.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/nav-projects$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/sidebar-07/components/nav-projects.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/nav-user$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/sidebar-07/components/nav-user.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/team-switcher$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/sidebar-07/components/team-switcher.tsx", import.meta.url),
        ),
      },
      // library-page (Task 110): empty, and the page's two component files at their install paths
      // (the page reaches sidebar-07's app-sidebar through the alias above).
      {
        find: /^@\/components\/ui\/empty$/,
        replacement: fileURLToPath(new URL("./registry/ui/empty/empty.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/shelf$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/library-page/components/shelf.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/continue-reading$/,
        replacement: fileURLToPath(
          new URL(
            "./registry/blocks/library-page/components/continue-reading.tsx",
            import.meta.url,
          ),
        ),
      },
      // chat-thread (Task 108): the chat items it composes.
      {
        find: /^@\/components\/ui\/message-scroller$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/message-scroller/message-scroller.tsx", import.meta.url),
        ),
      },
      {
        find: /^@\/components\/ui\/message$/,
        replacement: fileURLToPath(new URL("./registry/ui/message/message.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/bubble$/,
        replacement: fileURLToPath(new URL("./registry/ui/bubble/bubble.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/marker$/,
        replacement: fileURLToPath(new URL("./registry/ui/marker/marker.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/ui\/attachment$/,
        replacement: fileURLToPath(
          new URL("./registry/ui/attachment/attachment.tsx", import.meta.url),
        ),
      },
      // series-page (Task 109): tabs, and the page's header at its install path.
      {
        find: /^@\/components\/ui\/tabs$/,
        replacement: fileURLToPath(new URL("./registry/ui/tabs/tabs.tsx", import.meta.url)),
      },
      {
        find: /^@\/components\/series-header$/,
        replacement: fileURLToPath(
          new URL("./registry/blocks/series-page/components/series-header.tsx", import.meta.url),
        ),
      },
      // trace (Task 101) → collapsible.
      {
        find: /^@\/components\/blocks\/(.+)$/,
        replacement: `${fileURLToPath(new URL("./registry/blocks/", import.meta.url))}$1`,
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
      "scripts/**/*.test.ts",
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
