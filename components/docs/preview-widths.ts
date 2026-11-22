// A plain module, so server components (the Blocks index) read the values too: a constant
// exported from a "use client" file reaches a server component as a client reference.

/** The widths a page block is previewed at, in CSS pixels: a phone, a tablet, a desktop. */
export const PREVIEW_WIDTHS = [
  { id: "phone", label: "Phone", width: 375 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "desktop", label: "Desktop", width: 1280 },
] as const;

export type PreviewWidth = (typeof PREVIEW_WIDTHS)[number]["id"];

/**
 * The smallest scale an app shell (a sidebar beside its page) is previewed at: it is what
 * "readable" means here. A preview lays the shell out at the widest width that fits this scale
 * and still has the sidebar beside the page (1280, else the sidebar's 768 px breakpoint); a box
 * too narrow even for 768 at this scale shows the phone layout, unscaled.
 *
 * The rule goes by scale, not by window, because the docs column is not monotonic in the window:
 * it is the window less about 70 px below 768 px, and less about 350 px from 768 px, where the
 * docs sidebar opens beside it. So a 768 px window's column (399 px for the sidebar's variant box
 * with a classic 17 px scrollbar, 416 without) is narrower than a 480 px window's, and no box
 * cutoff could keep the 1280 px desktop for the one and not shrink it to a third for the other.
 */
export const SHELL_MIN_SCALE = 0.5;

/**
 * A preview box at least this wide (768 × SHELL_MIN_SCALE = 384 px) shows an app shell's desktop
 * layout, scaled down to fit; narrower, it shows the phone layout. It sits between a phone's
 * variant box (362 px in a 430 px window) and a 768 px window's (399 px with a 17 px scrollbar).
 */
export const SHELL_DESKTOP_MIN_BOX = PREVIEW_WIDTHS[1].width * SHELL_MIN_SCALE;
