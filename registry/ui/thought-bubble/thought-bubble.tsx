import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

const thoughtBubbleVariants = cva(
  "relative isolate mb-9 inline-block max-w-[28ch] px-7 py-4 text-center leading-snug text-balance text-ink",
  {
    variants: {
      font: {
        dialogue: "font-dialogue",
        inherit: "",
      },
    },
    defaultVariants: { font: "dialogue" },
  },
);

// The trail shrinks as it leaves the bubble; each dot steps further out.
const DOTS = ["size-4", "size-3", "size-2"];
const STEP = { left: ["", "-ml-3", "-ml-5"], right: ["", "-mr-3", "-mr-5"] };

export interface ThoughtBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof thoughtBubbleVariants> {
  /** Dots in the trail, 1–3. */
  dots?: 1 | 2 | 3;
  tailSide?: "left" | "right";
}

/** A dashed, hand-drawn thought bubble with a trail of rough ink dots. The text stays real. */
export function ThoughtBubble({
  className,
  dots = 2,
  tailSide = "left",
  font,
  role,
  children,
  ...props
}: ThoughtBubbleProps) {
  return (
    <div
      data-slot="thought-bubble"
      data-dots={dots}
      data-tail-side={tailSide}
      role={role ?? (props["aria-label"] ? "note" : undefined)}
      className={cn(thoughtBubbleVariants({ font }), className)}
      {...props}
    >
      <InkFrame
        as="span"
        shape="ellipse"
        dashed
        className="pointer-events-none absolute inset-0 -z-1"
      />
      {children}
      <span
        aria-hidden="true"
        data-slot="thought-bubble-dots"
        className={cn(
          "pointer-events-none absolute top-full mt-1 flex flex-col gap-1",
          tailSide === "left" ? "left-[22%] items-start" : "right-[22%] items-end",
        )}
      >
        {DOTS.slice(0, dots).map((size, index) => (
          <InkFrame
            key={size}
            as="span"
            shape="ellipse"
            className={cn("block", size, STEP[tailSide][index])}
          />
        ))}
      </span>
    </div>
  );
}
