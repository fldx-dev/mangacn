/**
 * The Create page's starter kits: registry item names that install together. A kit lists items,
 * not the theme or the fonts: the look installs its theme item (which brings the font items),
 * and the fonts choice sets the faces. So `basics` plus the default look is what the
 * Installation page installs (`SETUP_ITEMS`: theme, ink-frame, speech-bubble), plus a button.
 * No Node imports: the page reads this in the browser.
 */

/** The named kits, in code order (code version 1, `./code.ts`): append only. */
export const KIT_NAMES = ["basics", "reader", "app-shell", "chat", "series-site"] as const;
export type KitName = (typeof KIT_NAMES)[number];

export const KITS: Record<KitName, readonly string[]> = {
  basics: ["ink-frame", "speech-bubble", "button"],
  reader: ["reader", "chapter-list", "volume-grid", "spread-viewer"],
  "app-shell": ["sidebar-07", "login-01", "signup-01"],
  chat: ["chat-thread"],
  "series-site": ["series-page", "library-page", "character-card"],
};

/**
 * The item names a custom kit can carry in code version 1, sorted: every catalog item on
 * 2026-11-12 except the `registry:theme` and `registry:font` items (the look and the fonts
 * choose those). A custom kit is stored as indexes into this list, so it is frozen: an item
 * added to the catalog later needs a new code version, whose list is this one with the new names
 * appended (`./code.ts`). A test checks every name here is still in the catalog.
 */
export const KIT_CATALOG_V1 = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "attachment",
  "avatar",
  "badge",
  "breadcrumb",
  "bubble",
  "button",
  "button-group",
  "calendar",
  "caption-box",
  "card",
  "carousel",
  "chapter-list",
  "character-card",
  "chart",
  "chart-tones",
  "chat-thread",
  "checkbox",
  "code-block",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "emanata",
  "empty",
  "field",
  "focus-lines",
  "halftone-background",
  "hover-card",
  "ink-arrow",
  "ink-frame",
  "ink-mark",
  "ink-splash-loader",
  "ink-splatter",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "library-page",
  "login-01",
  "manga-frame",
  "manga-motion",
  "marker",
  "menubar",
  "message",
  "message-scroller",
  "native-select",
  "navigation-menu",
  "page-number",
  "page-turn",
  "pagination",
  "panel",
  "panel-grid",
  "popover",
  "power-gauge",
  "progress",
  "questionnaire",
  "radio-group",
  "reader",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "series-page",
  "sfx-text",
  "sfx-ticker",
  "sheet",
  "sidebar",
  "sidebar-07",
  "signup-01",
  "skeleton",
  "slider",
  "sonner",
  "speech-bubble",
  "speed-lines",
  "spinner",
  "spread-viewer",
  "stamp",
  "switch",
  "table",
  "tabs",
  "textarea",
  "thought-bubble",
  "toggle",
  "toggle-group",
  "tooltip",
  "trace",
  "use-highlighted-code",
  "use-mobile",
  "vertical-text",
  "volume-grid",
] as const;

/** The items a kit installs, by name. */
export function kitItems(kit: { preset: KitName } | { custom: readonly string[] }): string[] {
  return "preset" in kit ? [...KITS[kit.preset]] : [...kit.custom];
}
