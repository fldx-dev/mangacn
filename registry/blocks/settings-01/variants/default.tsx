import { settings } from "@/registry/blocks/settings-01/components/settings-data";
import { SettingsForm } from "@/registry/blocks/settings-01/components/settings-form";

// The page's form on its own; /view/settings-01 is the whole page with its heading.
export default function Settings01DefaultVariant() {
  return <SettingsForm defaultValues={settings} className="max-w-5xl" />;
}
