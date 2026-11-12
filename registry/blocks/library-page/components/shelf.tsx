import { cn } from "cn";
import * as React from "react";
import { type Volume, VolumeGrid } from "@/components/blocks/volume-grid/volume-grid";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** What an empty shelf says, and the one thing it offers to do. */
export interface ShelfEmpty {
  /**
   * The empty state's title.
   * @default "Nothing on this shelf"
   */
  title?: string;
  /** A short line under the shelf's name ("Nothing here yet."). */
  description: string;
  /** The action: a link, such as "Browse series". */
  action: { label: string; href: string };
}

export interface ShelfProps extends Omit<React.ComponentProps<"section">, "children" | "title"> {
  /** The shelf's name, its heading and the name of its section. */
  title: string;
  /** The shelf's volumes; none shows `empty`. */
  volumes: Volume[];
  /** How many volumes the shelf holds, shown beside its name; leave it out to show none. */
  count?: number;
  /** What the shelf shows when it holds no volumes. */
  empty?: ShelfEmpty;
  /**
   * How many covers load at once; the rest load lazily. A shelf usually sits below the page's
   * first screen, so none do.
   * @default 0
   */
  eager?: number;
}

/** "1 volume", "12 volumes". */
export function volumeCount(count: number): string {
  return `${count} ${count === 1 ? "volume" : "volumes"}`;
}

/**
 * One shelf of a reader's library: a section named by its heading, an optional count, and the
 * shelf's volumes as a volume-grid of cover links, or `empty` with a short line and an action
 * when it holds none. A server component with no state: it renders what it is given and draws
 * nothing of its own.
 */
export function Shelf({
  title,
  volumes,
  count,
  empty,
  eager = 0,
  className,
  ...props
}: ShelfProps) {
  const headingId = React.useId();
  return (
    <section
      data-slot="shelf"
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={headingId} className="font-display text-xl leading-tight uppercase">
          {title}
        </h2>
        {count !== undefined && (
          <p className="text-sm text-muted-foreground tabular-nums">{volumeCount(count)}</p>
        )}
      </div>
      {volumes.length > 0 ? (
        <VolumeGrid volumes={volumes} label={`${title} volumes`} eager={eager} />
      ) : (
        // As wide as a volume-grid, so the empty state sits where the covers would.
        <Empty className="max-w-4xl">
          <EmptyHeader>
            <EmptyMedia />
            <EmptyTitle>{empty?.title ?? "Nothing on this shelf"}</EmptyTitle>
            {empty && <EmptyDescription>{empty.description}</EmptyDescription>}
          </EmptyHeader>
          {empty && (
            <EmptyContent>
              {/* A link drawn as a button: Base UI marks a non-native button role="button". */}
              <Button
                nativeButton={false}
                role="link"
                render={<a href={empty.action.href} />}
                size="sm"
              >
                {empty.action.label}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
    </section>
  );
}
