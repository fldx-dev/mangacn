// A plain module, so server components (the Blocks index) read the values too: a constant
// exported from a "use client" file reaches a server component as a client reference.

/** The widths a page block is previewed at, in CSS pixels: a phone, a tablet, a desktop. */
export const PREVIEW_WIDTHS = [
  { id: "phone", label: "Phone", width: 375 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "desktop", label: "Desktop", width: 1280 },
] as const;

export type PreviewWidth = (typeof PREVIEW_WIDTHS)[number]["id"];
