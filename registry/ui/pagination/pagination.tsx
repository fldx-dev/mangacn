import { cn } from "cn";
import { MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";

// Based on shadcn/ui Pagination (MIT, https://ui.shadcn.com), base-nova style, fetched
// 2026-11-03. Restyled for mangacn: pages are outlined buttons and the current page is
// ink-filled (stock: ghost and outline); previous and next carry a hand-inked chevron, and the
// links are announced as links.

/** A brush-drawn chevron pointing left or right: one slightly bowed stroke, lucide's box. */
function InkChevron({
  direction,
  ...props
}: React.ComponentProps<"svg"> & { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d={
          direction === "left"
            ? "M15.4 5.4c-2.3 2.1-4.4 4.3-6.6 6.5 2.1 2.3 4.2 4.4 6.3 6.7"
            : "M8.6 5.4c2.3 2.1 4.4 4.3 6.6 6.5-2.1 2.3-4.2 4.4-6.3 6.7"
        }
      />
    </svg>
  );
}

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      // biome-ignore lint/a11y/noRedundantRoles: stock markup, kept for parity.
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      // gap-1 (stock gap-0.5) so neighbouring hand-drawn outlines do not touch.
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      // Base UI marks every non-native button `role="button"`, an anchor included.
      role="link"
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    >
      {/* On the Button, after its InkFrame: children inside `render` would replace the frame. */}
      {children}
    </Button>
  );
}

/**
 * The link's accessible name: stock's "Go to previous page", plus the visible text when `text`
 * replaces stock's word, so the name contains the label sighted users see (WCAG 2.5.3, axe's
 * `label-content-name-mismatch`). A caller's own `aria-label` still wins.
 */
function labelInName(name: string, text: string, stockText: string): string {
  return text === stockText ? name : `${name}: ${text}`;
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label={labelInName("Go to previous page", text, "Previous")}
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <InkChevron direction="left" data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label={labelInName("Go to next page", text, "Next")}
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <InkChevron direction="right" data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
