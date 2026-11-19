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
 * A preview box at least this wide shows an app shell (a sidebar beside its page) at a desktop
 * layout, scaled down to fit; narrower, it shows the phone layout. The docs column is about
 * 680 px wide in a 1280 px window, short of the sidebar's 768 px breakpoint, and a phone's
 * column is under 400 px.
 */
export const SHELL_DESKTOP_MIN_BOX = 576;
