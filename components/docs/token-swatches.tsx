import type * as React from "react";
import themeRegistry from "@/registry/theme/registry.json";

const TOKENS = [
  "ink",
  "paper",
  "spot",
  "spot-foreground",
  "tone-1",
  "tone-2",
  "tone-3",
  "tone-4",
] as const;

type Mode = "light" | "dark";

const theme = themeRegistry.items.find((item) => item.name === "theme");

/**
 * The eight theme tokens, one row per mode. Each row sets that mode's values from the theme
 * item itself, so both rows read true whichever mode the site is in.
 */
export function TokenSwatches() {
  return (
    <div data-slot="token-swatches" className="not-prose my-6 grid gap-4">
      {(["light", "dark"] as const).map((mode) => (
        <SwatchRow key={mode} mode={mode} />
      ))}
    </div>
  );
}

function SwatchRow({ mode }: { mode: Mode }) {
  const values = (theme?.cssVars?.[mode] ?? {}) as Record<string, string>;
  const style = Object.fromEntries(
    TOKENS.map((token) => [`--${token}`, values[token]]),
  ) as React.CSSProperties;
  return (
    <figure
      style={style}
      className="m-0 grid gap-3 rounded-[var(--radius)] bg-paper p-4 text-ink ink-border"
    >
      <figcaption className="text-sm font-medium">
        {mode === "light" ? "Light (page)" : "Dark (dim night)"}
      </figcaption>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
        {TOKENS.map((token) => (
          <li key={token} className="grid min-w-0 gap-1.5">
            <span
              aria-hidden="true"
              className="block h-12 rounded-[var(--radius)] ink-border"
              style={{ background: `var(--${token})` }}
            />
            <code className="truncate text-xs">--{token}</code>
            <span className="truncate font-mono text-[0.6875rem] text-tone-3">{values[token]}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
