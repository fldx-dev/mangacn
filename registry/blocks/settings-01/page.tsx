import { settings } from "./components/settings-data";
import { SettingsForm } from "./components/settings-form";

// A signed-in reader's account settings: one route, four sections and a section nav. The page
// is a server component; the form holds the state. Everything on it comes from `settings`;
// replace it with your fetch (`const settings = await getSettings()` in this async page). Inside
// your app's own shell (a sidebar layout, a header), put the content below in its content area
// instead of this `main`.

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-10 md:p-6 xl:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight uppercase">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account, notifications and reading preferences.
        </p>
      </header>
      <SettingsForm defaultValues={settings} />
    </main>
  );
}
