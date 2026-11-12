"use client";

import { type ReactNode, useEffect, useId, useState } from "react";
import {
  applyPreset,
  readStoredPreset,
  storePreset,
  type ThemeLook,
} from "@/lib/registry/theme-presets";

export interface LookOption {
  look: ThemeLook;
  label: string;
}

/**
 * The Theming page's preset switch: a radio group (Tab to it, arrows to choose) that shows the
 * whole docs site in the chosen look at once, remembers it for every docs page in this browser
 * and prints the install command for it. Each swatch is scoped to its own look, so it shows that
 * look's paper, ink and spot whatever the page is in.
 */
export function ThemePresetSwitch({
  looks,
  commands,
}: {
  looks: LookOption[];
  /** The install block of each look, rendered on the server. */
  commands: Record<string, ReactNode>;
}) {
  const id = useId();
  const [look, setLook] = useState<ThemeLook>("default");

  // The server renders the default; the stored choice (already on <html>) arrives after hydration.
  useEffect(() => {
    setLook(readStoredPreset() ?? "default");
  }, []);

  const choose = (next: ThemeLook) => {
    setLook(next);
    applyPreset(next);
    storePreset(next);
  };

  return (
    <div data-slot="theme-presets" data-look={look} className="not-prose my-6 grid min-w-0 gap-4">
      <fieldset className="grid min-w-0 gap-2">
        <legend className="mb-2 text-sm font-medium">Theme preset</legend>
        <div className="flex flex-wrap gap-3">
          {looks.map((option) => (
            <label
              key={option.look}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-[var(--radius)] bg-paper px-3 py-2 text-sm text-ink ink-border has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name={`${id}-look`}
                value={option.look}
                checked={look === option.look}
                onChange={() => choose(option.look)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                data-theme-preset={option.look}
                className="inline-flex items-center gap-1 rounded-full bg-paper p-1 ink-border"
              >
                <span className="size-3 rounded-full bg-ink" />
                <span className="size-3 rounded-full bg-tone-2" />
                <span className="size-3 rounded-full bg-spot" />
              </span>
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div data-slot="theme-presets-command" className="min-w-0">
        {commands[look]}
      </div>
    </div>
  );
}
