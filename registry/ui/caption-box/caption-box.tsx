import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// In a corner the box is absolute on that corner of its `relative` parent, so its outline lies
// on the parent's frame, as the panel's own caption does; `z-1` keeps it over the content.
const captionBoxVariants = cva("relative isolate w-fit px-3 py-1.5 text-sm leading-snug text-ink", {
  variants: {
    corner: {
      none: "max-w-prose",
      "top-left": "absolute top-0 left-0 z-1 max-w-[85%]",
      "top-right": "absolute top-0 right-0 z-1 max-w-[85%]",
      "bottom-left": "absolute bottom-0 left-0 z-1 max-w-[85%]",
      "bottom-right": "absolute right-0 bottom-0 z-1 max-w-[85%]",
    },
    font: {
      dialogue: "font-dialogue",
      body: "font-sans",
    },
    tone: {
      paper: "",
      tone: "",
    },
  },
  defaultVariants: { corner: "none", font: "dialogue", tone: "paper" },
});

export interface CaptionBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof captionBoxVariants> {
  /**
   * The fill inside the outline: paper, or the lightest screentone grey.
   * @default "paper"
   */
  tone?: VariantProps<typeof captionBoxVariants>["tone"];
  /**
   * `dialogue` sets the narration in the lettering face; `body` in the page's body face.
   * @default "dialogue"
   */
  font?: VariantProps<typeof captionBoxVariants>["font"];
  /**
   * `none` keeps the box in the flow. A corner places it absolutely on that corner of its
   * nearest positioned parent (a `panel`), its outline overlapping the parent's frame.
   * @default "none"
   */
  corner?: VariantProps<typeof captionBoxVariants>["corner"];
  /** Names the box (the narrator, say) and exposes it as a `note`. Without it, plain text. */
  "aria-label"?: string;
}

/**
 * A narration box: square corners, a heavy hand-drawn outline on paper or tone, real text.
 * In flow on its own, or pinned to a corner of a panel with `corner`.
 */
export function CaptionBox({
  className,
  tone,
  font,
  corner,
  role,
  children,
  ...props
}: CaptionBoxProps) {
  return (
    <div
      data-slot="caption-box"
      data-tone={tone ?? "paper"}
      data-font={font ?? "dialogue"}
      data-corner={corner ?? "none"}
      role={role ?? (props["aria-label"] ? "note" : undefined)}
      className={cn(captionBoxVariants({ tone, font, corner }), className)}
      {...props}
    >
      <InkFrame
        as="span"
        fill={tone === "tone" ? "tone" : "paper"}
        className={cn(
          "pointer-events-none absolute inset-0 -z-1 rounded-none [--outline-width:var(--outline-width-heavy)]",
          // The lightest tone rather than InkFrame's mid-grey `tone` fill, as speech-bubble does.
          tone === "tone" && "[--tone-2:var(--tone-1)]",
        )}
      />
      {children}
    </div>
  );
}
