import { FileManager } from "./components/file-manager";
import {
  fileManagerFiles,
  fileManagerFolders,
  fileManagerStartFolder,
} from "./components/file-manager-data";

// A project's files: the folder tree, the open folder's contents and an upload, in one view. The
// page is a server component; the file manager holds the state. Replace the sample folders and
// files with your fetch (`const files = await listFiles()` in this async page). Inside
// sidebar-07's shell, put the content below in its `SidebarInset` instead of this `main`.

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-[80rem] flex-col gap-6 p-4 pb-10 md:p-6 xl:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight uppercase">Files</h1>
        <p className="text-sm text-muted-foreground">
          Pages, covers and scripts for every series, by folder.
        </p>
      </header>
      <FileManager
        folders={fileManagerFolders}
        defaultFiles={fileManagerFiles}
        defaultFolder={fileManagerStartFolder}
      />
    </main>
  );
}
