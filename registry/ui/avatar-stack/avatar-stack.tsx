"use client";

import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// mangacn avatar stack: the data-driven version of avatar's AvatarGroup and AvatarGroupCount.
// It shows `max` avatars and a "+N" button whose tooltip names the rest; initials stand in for a
// missing picture, with the full name for assistive tech.

/** Built-in words, each overridable through `labels`. */
const defaultLabels = { more: (n: number) => `${n} more` };

export interface AvatarStackItem {
  /** The person's name: the image's `alt`, the source of the initials and the tooltip entry. */
  name: string;
  /** A picture URL. Without it (or until it loads) the avatar shows the name's initials. */
  src?: string;
}

export interface AvatarStackProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The people, in the order they are drawn. */
  items: AvatarStackItem[];
  /**
   * How many avatars show before the rest fold into "+N".
   * @default 4
   */
  max?: number;
  /**
   * Avatar's sizes; the "+N" button follows.
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * The "+N" button's name.
   * @default { more: (n) => `${n} more` }
   */
  labels?: Partial<typeof defaultLabels>;
  /** Names the group. Defaults to "{n} people". */
  "aria-label"?: string;
}

/** "Rumiko Takahashi" → "RT", "Clamp" → "C". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function AvatarStack({
  items,
  max = 4,
  size = "default",
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: AvatarStackProps) {
  const words = { ...defaultLabels, ...labels };
  const limit = Math.max(0, Math.floor(max));
  const shown = items.length > limit ? items.slice(0, limit) : items;
  const hidden = items.slice(shown.length);

  return (
    <div data-slot="avatar-stack" className={cn("flex w-fit", className)} {...props}>
      <AvatarGroup
        role="group"
        aria-label={ariaLabel ?? `${items.length} people`}
        className="flex-nowrap"
      >
        {shown.map((item, index) => (
          // Names can repeat; the position keeps keys unique.
          // biome-ignore lint/suspicious/noArrayIndexKey: the list is static per render
          <Avatar key={`${item.name}-${index}`} size={size}>
            {item.src && <AvatarImage src={item.src} alt={item.name} />}
            <AvatarFallback>
              <span aria-hidden="true">{initials(item.name)}</span>
              <span className="sr-only">{item.name}</span>
            </AvatarFallback>
          </Avatar>
        ))}
        {hidden.length > 0 && (
          <AvatarGroupCount>
            <Tooltip>
              <TooltipTrigger
                aria-label={words.more(hidden.length)}
                className="absolute inset-0 flex items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden="true">+{hidden.length}</span>
              </TooltipTrigger>
              <TooltipContent>{hidden.map((item) => item.name).join(", ")}</TooltipContent>
            </Tooltip>
            <InkFrame
              as="span"
              shape="ellipse"
              fill="none"
              className="pointer-events-none absolute inset-0 z-1"
            />
          </AvatarGroupCount>
        )}
      </AvatarGroup>
    </div>
  );
}
