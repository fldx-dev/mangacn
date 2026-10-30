import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { InkFrame, type InkFrameProps } from "@/components/ink-frame";

// Based on shadcn/ui Button (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-30.
// Restyled for mangacn: InkFrame draws the outline and fill; no CSS border, no shadow.

const buttonVariants = cva(
  "group/button relative isolate inline-flex shrink-0 items-center justify-center rounded-lg border-0 bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-[1px_1px] disabled:pointer-events-none disabled:opacity-100 disabled:bg-background disabled:text-muted-foreground disabled:halftone-light has-[>[data-inked=true]]:bg-transparent! aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 hover:[&>[data-slot=ink-frame]]:opacity-80",
        outline:
          "bg-background hover:bg-muted hover:text-foreground hover:[--paper:var(--muted)] aria-expanded:bg-muted aria-expanded:text-foreground aria-expanded:[--paper:var(--muted)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] hover:[&>[data-slot=ink-frame]]:opacity-80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive [--ink:var(--destructive)] hover:bg-destructive/20 hover:[--paper:color-mix(in_oklch,var(--destructive)_12%,var(--background))] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        sfx: "bg-paper font-display tracking-wide text-ink uppercase hover:[--paper:var(--muted)] active:not-aria-[haspopup]:translate-[2px_2px]",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** The InkFrame fill each variant draws. Ghost and link draw none: stock gives them no border. */
const frameFills: Record<string, InkFrameProps["fill"] | undefined> = {
  default: "ink",
  outline: "paper",
  secondary: "tone",
  destructive: "paper",
  sfx: "paper",
};

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const fill = frameFills[variant ?? "default"];
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {fill && (
        <InkFrame
          as="span"
          // A disabled button shows its halftone through an unfilled outline.
          fill={props.disabled ? "none" : fill}
          className="pointer-events-none absolute inset-0 -z-1"
        />
      )}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
