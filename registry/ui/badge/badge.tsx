import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { InkFrame, type InkFrameProps } from "@/components/ink-frame";

// Based on shadcn/ui Badge (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-30.
// Restyled for mangacn: InkFrame draws the outline and fill; no CSS border, no shadow.

const badgeVariants = cva(
  "group/badge relative isolate inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-4xl border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 has-[>[data-inked=true]]:bg-transparent! aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/80 [a]:hover:[&>[data-slot=ink-frame]]:opacity-80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80 [a]:hover:[&>[data-slot=ink-frame]]:opacity-80",
        destructive:
          "bg-destructive/10 text-destructive [--ink:var(--destructive)] focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground [a]:hover:[--paper:var(--muted)]",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        spot: "bg-spot text-spot-foreground [--ink:var(--spot)] [a]:hover:bg-spot/80 [a]:hover:[&>[data-slot=ink-frame]]:opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** The InkFrame fill each variant draws. Ghost and link draw none: stock gives them no border. */
const frameFills: Record<string, InkFrameProps["fill"] | undefined> = {
  default: "ink",
  secondary: "tone",
  destructive: "paper",
  outline: "paper",
  spot: "ink",
};

function Badge({
  className,
  variant = "default",
  render,
  children,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const fill = frameFills[variant ?? "default"];
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        children: (
          <>
            {fill && (
              <InkFrame
                as="span"
                fill={fill}
                className="pointer-events-none absolute inset-0 -z-1"
              />
            )}
            {children}
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
