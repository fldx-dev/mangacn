import { loadPresets } from "@/lib/registry/theme-preset-items";
import { presetItemName, THEME_LOOKS } from "@/lib/registry/theme-presets";
import { InstallCommand } from "./install-command";
import { type LookOption, ThemePresetSwitch } from "./theme-preset-switch";

/** The default look and every preset, with their titles from the values files. */
export function themeLooks(): LookOption[] {
  const titles = new Map(loadPresets().map((preset) => [preset.name, preset.title]));
  return THEME_LOOKS.map((look) => ({
    look,
    label: look === "default" ? "Default" : (titles.get(look) ?? look),
  }));
}

/** The Theming page's preset switch, with each look's install block rendered here. */
export function ThemePresets() {
  const commands = Object.fromEntries(
    THEME_LOOKS.map((look) => [look, <InstallCommand key={look} item={presetItemName(look)} />]),
  );
  return <ThemePresetSwitch looks={themeLooks()} commands={commands} />;
}
