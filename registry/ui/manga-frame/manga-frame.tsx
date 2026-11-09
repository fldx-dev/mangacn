import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

const aspectVariants = cva("block w-full", {
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
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "className" | "children">,
    VariantProps<typeof aspectVariants> {
  /** The picture's URL, passed to the `<img>`. Pass `src` and `alt`, or `children`. */
  src?: string;
  /** Required with `src`: describe the picture, or pass `""` when it is purely decorative. */
  alt?: string;
  /**
   * A drawn or lettered scene in place of a picture, in the theme's fonts and tokens. It fills a
   * `relative isolate` box of the same aspect, clipped to the frame and centred on paper, so
   * `speed-lines` or `focus-lines` go in as its first child. Real text stays readable as text.
   */
  children?: React.ReactNode;
  /**
   * The picture's (or scene's) aspect ratio; a picture is cropped to fill (`object-cover`).
   * @default "4/3"
   */
  aspect?: VariantProps<typeof aspectVariants>["aspect"];
  /**
   * A halftone mat between the frame and the picture.
   * @default false
   */
  matte?: boolean;
  /** Shown under the frame in a `<figcaption>`. */
  caption?: React.ReactNode;
  /** Applied to the `<figure>`; other props go to the `<img>` (or the scene's box). */
  className?: string;
}

/** A picture needs its alt text; a scene takes neither `src` nor `alt`. */
type MangaFrameContent =
  | { src: string; alt: string; children?: never }
  | { src?: never; alt?: never; children: React.ReactNode };

/**
 * An image, or a drawn or lettered scene, in a hand-drawn ink frame, with aspect presets, an
 * optional halftone mat and a caption. Uses a plain `<img>` (any `src` works, and the frame
 * does not know the picture's size for `next/image`); swap in your framework's image component
 * if you like.
 */
export function MangaFrame({
  src,
  alt,
  aspect,
  matte = false,
  caption,
  className,
  children,
  ...props
}: MangaFrameProps & MangaFrameContent) {
  const picture =
    src !== undefined ? (
      // biome-ignore lint/performance/noImgElement: framework-free on purpose; users may swap it.
      <img // eslint-disable-line @next/next/no-img-element -- any src; next/image needs a size.
        data-slot="manga-frame-image"
        src={src}
        alt={alt}
        className={cn(aspectVariants({ aspect }), "object-cover")}
        {...props}
      />
    ) : (
      <div
        data-slot="manga-frame-scene"
        className={cn(
          aspectVariants({ aspect }),
          "relative isolate grid place-items-center overflow-hidden bg-paper p-4 text-ink",
        )}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  return (
    <figure
      data-slot="manga-frame"
      data-aspect={aspect ?? "4/3"}
      data-matte={matte}
      data-content={src !== undefined ? "image" : "scene"}
      className={cn("flex min-w-0 flex-col gap-2 text-ink", className)}
    >
      <div className={cn("relative isolate", matte && "halftone-light p-3")}>
        {matte ? (
          <div className="relative isolate">
            {picture}
            <InkFrame as="span" fill="none" className={FRAME} />
          </div>
        ) : (
          picture
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
