import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

const imageVariants = cva("block w-full object-cover", {
  variants: {
    aspect: {
      "4/3": "aspect-4/3",
      "3/4": "aspect-3/4",
      "1/1": "aspect-square",
      "16/9": "aspect-video",
    },
  },
  defaultVariants: { aspect: "4/3" },
});

// Drawn over the picture (not behind it), so the ink line sits on the image edge.
const FRAME = "pointer-events-none absolute inset-0 z-1";

export interface MangaFrameProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "className">,
    VariantProps<typeof imageVariants> {
  src: string;
  /** Required: describe the picture, or pass `""` when it is purely decorative. */
  alt: string;
  /** A halftone mat between the frame and the picture. */
  matte?: boolean;
  caption?: React.ReactNode;
  /** Applied to the `<figure>`; other props go to the `<img>`. */
  className?: string;
}

/**
 * An image in a hand-drawn ink frame, with aspect presets, an optional halftone mat and a
 * caption. Uses a plain `<img>`; swap in your framework's image component if you like.
 */
export function MangaFrame({
  src,
  alt,
  aspect,
  matte = false,
  caption,
  className,
  ...props
}: MangaFrameProps) {
  const image = (
    // biome-ignore lint/performance/noImgElement: framework-free on purpose; users may swap it.
    <img
      data-slot="manga-frame-image"
      src={src}
      alt={alt}
      className={imageVariants({ aspect })}
      {...props}
    />
  );
  return (
    <figure
      data-slot="manga-frame"
      data-aspect={aspect ?? "4/3"}
      data-matte={matte}
      className={cn("flex min-w-0 flex-col gap-2 text-ink", className)}
    >
      <div className={cn("relative isolate", matte && "halftone-light p-3")}>
        {matte ? (
          <div className="relative isolate">
            {image}
            <InkFrame as="span" fill="none" className={FRAME} />
          </div>
        ) : (
          image
        )}
        <InkFrame
          as="span"
          fill="none"
          className={cn(FRAME, "[--outline-width:var(--outline-width-heavy)]")}
        />
      </div>
      {caption != null && (
        <figcaption data-slot="manga-frame-caption" className="text-sm">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
