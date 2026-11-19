import { uploadSeries } from "./components/upload-data";
import { UploadForm } from "./components/upload-form";

// A creator's chapter upload: the series, number and title, then the pages with their progress,
// in one card. The page is a server component; the form holds the state and the simulated
// upload. Replace `uploadSeries` with your fetch (`const series = await getSeries()` in this
// async page). Inside sidebar-07's shell, put the content below in its `SidebarInset` instead of
// this `main`.

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-[48rem] flex-col gap-6 p-4 pb-10 md:p-6 xl:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight uppercase">Upload chapter</h1>
        <p className="text-sm text-muted-foreground">
          Add the pages, wait for each to finish, then publish.
        </p>
      </header>
      <UploadForm series={uploadSeries} />
    </main>
  );
}
