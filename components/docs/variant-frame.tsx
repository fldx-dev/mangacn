import { cn } from "cn";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { cacheLife } from "next/cache";
import { inkDark, inkLight } from "@/lib/docs/code-theme";
import { isSidebarShell } from "@/lib/docs/sidebar-shell";
import { docVariant, variantDisplayName, variantInstallCommands } from "@/lib/docs/variant-meta";
import { getVariantEntry, getVariantSource } from "@/lib/docs/variant-source";
import { getVariantLoader } from "@/lib/registry/variants";
import { ScaledFrame } from "./block-preview";
import { CopyInstallChip } from "./copy-install-chip";
import { PREVIEW_WIDTHS, SHELL_DESKTOP_MIN_BOX } from "./preview-widths";
import { StageFrame } from "./stage-frame";

// Overlay items render their stage in an iframe, so two open dialogs or sheets never stack on
// one page; every other variant renders inline, which keeps the docs pages free of iframes.
export const OVERLAY_ITEMS: ReadonlySet<string> = new Set([
  "dialog",
  "sheet",
  "tooltip",
  "popover",
  "dropdown-menu",
  "alert-dialog",
  "hover-card",
  "drawer",
  "sonner",
  "context-menu",
  "menubar",
  "sidebar",
  "navigation-menu",
  "combobox",
  "command",
  "multi-select",
  "color-picker",
  "date-range-picker",
]);

export interface VariantFrameProps {
  item: string;
  variant: string;
  /** The iframe's accessible name (overlay items). Defaults to `variantDisplayName`. */
  title?: string;
  /** The iframe's height (overlay items). */
  height?: string;
}

/**
 * One variant: for a component, a header with its label (the sidebar's `#c-<component>-<n>`
 * anchor), its title and a chip that copies its install command; then Preview / Code tabs and a
 * link to its stage. Throws on an unknown variant.
 */
export async function VariantFrame({ item, variant, title, height }: VariantFrameProps) {
  const meta = docVariant(item, variant);
  const preview = await VariantPreview({ item, variant, title, height });
  const alone = `/gallery/${item}/${variant}`;
  const code = await highlightVariantSource(item, variant);

  return (
    <div data-slot="variant-card" className="not-prose flex flex-col gap-3">
      {meta ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 id={meta.name} className="scroll-mt-24 text-base font-semibold text-fd-foreground">
              {meta.label}
            </h3>
            <p className="text-sm text-fd-muted-foreground">{meta.title}</p>
          </div>
          {meta.installable ? (
            <CopyInstallChip name={meta.name} commands={variantInstallCommands(meta.name)} />
          ) : null}
        </div>
      ) : null}
      <Tabs data-slot="variant-frame" items={["Preview", "Code"]}>
        <Tab value="Preview" className="flex flex-col gap-2">
          {preview}
          <a
            href={alone}
            target="_blank"
            rel="noopener"
            className="self-end text-sm text-fd-muted-foreground underline underline-offset-4 hover:text-fd-foreground"
          >
            Open in a new tab
            <span className="sr-only">: {variantDisplayName(item, variant)}</span>
          </a>
        </Tab>
        <Tab value="Code">{code}</Tab>
      </Tabs>
    </div>
  );
}

export interface VariantPreviewProps extends VariantFrameProps {
  /** Classes for the paper box of an inline variant. */
  className?: string;
  /** Overlay items: render the stage iframe inert (see `StageFrame`). The component index sets it. */
  inert?: boolean;
}

/**
 * The variant itself: inline in a paper box, or the stage in an iframe for overlay items. Throws
 * on an unknown variant.
 */
export async function VariantPreview({
  item,
  variant,
  title,
  height = "32rem",
  className,
  inert,
}: VariantPreviewProps) {
  getVariantEntry(item, variant);
  const load = getVariantLoader(item, variant);
  if (!load)
    throw new Error(`No loader for variant "${item}/${variant}"; run \`pnpm gen:variants\`.`);

  if (isSidebarShell(item)) {
    // The sidebar lays itself out by its window, and the docs column is narrower than its
    // 768 px breakpoint up to about a 1400 px window: the stage gets a tablet-wide window at least,
    // scaled to the column, and only a column too narrow to show it at SHELL_MIN_SCALE (under
    // SHELL_DESKTOP_MIN_BOX, a phone's) shows the phone layout (MANGA-19; a 768 px window's
    // column too since Task 144, with a classic scrollbar's since Task 175).
    return (
      <ScaledFrame
        src={`/gallery/${item}/${variant}`}
        title={title ?? variantDisplayName(item, variant)}
        width={PREVIEW_WIDTHS[1].width}
        fill
        nativeBelow={SHELL_DESKTOP_MIN_BOX}
        inert={inert}
        data-slot="variant-stage-box"
        className="rounded-sm border bg-paper"
        style={{ height }}
      />
    );
  }
  if (OVERLAY_ITEMS.has(item)) {
    return (
      <StageFrame
        src={`/gallery/${item}/${variant}`}
        title={title ?? variantDisplayName(item, variant)}
        height={height}
        inert={inert}
      />
    );
  }
  const { default: Variant } = await load();
  // A variant wider than its box scrolls sideways; the box takes focus so a keyboard can scroll it.
  return (
    <section
      aria-label={variantDisplayName(item, variant)}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll container must be focusable
      tabIndex={0}
      className={cn(
        "relative isolate flex min-h-40 min-w-0 items-center justify-center overflow-x-auto rounded-sm border bg-paper p-4 text-ink sm:p-8",
        className,
      )}
    >
      <Variant />
    </section>
  );
}

/**
 * The variant's source as a Fumadocs code block in the ink themes of the MDX code blocks, cached
 * for good: Shiki reads the clock while it works, which a prerender rejects, and the source
 * only changes with a new build.
 */
async function highlightVariantSource(item: string, variant: string) {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return ServerCodeBlock({
    code: getVariantSource(item, variant),
    lang: "tsx",
    themes: { light: inkLight, dark: inkDark },
    codeblock: { viewportProps: { "aria-label": `${variantDisplayName(item, variant)}: source` } },
  });
}
