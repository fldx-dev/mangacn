import { SettingsDialog } from "./components/settings-dialog";

// Based on shadcn/ui sidebar-13 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The page around the settings dialog: stock centres the dialog's button in a <div>; here that is
// the page's one `main`, with an h1 above the button. The dialog opens from the button.

export default function Page() {
  return (
    <main className="flex h-svh flex-col items-center justify-center gap-4">
      <h1 className="font-display text-2xl leading-tight uppercase">Reader settings</h1>
      <SettingsDialog />
    </main>
  );
}
