import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Separator } from "@/components/ui/separator";

// Based on shadcn/ui ButtonGroup (MIT, https://ui.shadcn.com), base-nova style, fetched
// 2026-11-09. Restyled for mangacn: one InkFrame (the root's first child) outlines the strip and
// a hand-drawn rule stands between neighbours, the way toggle-group draws. The group sets
// `data-grouped`, which mangacn's button, input and textarea read to draw no frame of their
// own; a select trigger's frame is turned off from here. A group of groups draws nothing itself:
// each nested group is its own strip. Stock's sibling selectors skip the frames
// (`[data-slot]:not([data-slot=ink-frame])`).

const buttonGroupVariants = cva(
  "relative isolate flex w-fit items-stretch rounded-lg *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>[data-slot=ink-frame]:has(>input)]:flex-1 [&>[data-slot=select-trigger]>[data-slot=ink-frame]]:hidden",
  {
    variants: {
      orientation: {
        horizontal:
          "*:data-slot:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg! [&>[data-slot]:not([data-slot=ink-frame])~[data-slot]]:rounded-l-none [&>[data-slot]:not([data-slot=ink-frame])~[data-slot]]:border-l-0",
        vertical:
          "flex-col *:data-slot:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg! [&>[data-slot]:not([data-slot=ink-frame])~[data-slot]]:rounded-t-none [&>[data-slot]:not([data-slot=ink-frame])~[data-slot]]:border-t-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

/** One wobble for every group's rules. */
const BUTTON_GROUP_SEED = 29;

function ButtonGroup({
  className,
  orientation,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  const items = React.Children.toArray(children);
  // A group of groups: each nested group draws its own strip, so this one draws nothing.
  const nested = items.some((child) => React.isValidElement(child) && child.type === ButtonGroup);
  const isSeparator = (child: React.ReactNode) =>
    React.isValidElement(child) && child.type === ButtonGroupSeparator;
  return (
    // biome-ignore lint/a11y/useSemanticElements: stock's <div role="group">, kept rather than retagged.
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      data-grouped={nested ? undefined : ""}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    >
      {!nested && (
        <InkFrame
          as="span"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 rounded-lg!"
        />
      )}
      {items.map((child, index) => {
        const previous = items[index - 1];
        // A rule between neighbours, unless one of them is an explicit ButtonGroupSeparator.
        const rule = !nested && index > 0 && !isSeparator(child) && !isSeparator(previous);
        return (
          <React.Fragment
            key={React.isValidElement(child) && child.key != null ? child.key : index}
          >
            {rule && (
              <InkFrame
                as="span"
                shape="line"
                fill="none"
                seed={BUTTON_GROUP_SEED}
                className={cn(
                  "pointer-events-none relative z-1 shrink-0 self-stretch",
                  orientation === "vertical" ? "h-(--outline-width)" : "w-(--outline-width)",
                )}
              />
            )}
            {child}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ButtonGroupText({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex items-center gap-2 rounded-lg border-0 bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "button-group-text",
    },
  });
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
