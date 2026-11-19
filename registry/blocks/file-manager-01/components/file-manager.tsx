"use client";

import { cn } from "cn";
import {
  ChevronDownIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileUpload, FileUploadDropzone, FileUploadTrigger } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type TreeNode, TreeView } from "@/components/ui/tree-view";
import type { FileManagerFile, FileManagerFolder } from "./file-manager-data";

// A file manager for one project: the folder tree, a breadcrumb of the open folder and its
// contents as a table with Rename, Download and Delete per file; Upload and a drop over the list
// add files to the open folder. Everything stays in this component's state and every change is
// announced; pass `onFilesChange` to keep your storage in step.

/** Fixed locale and time zone, so the server and the browser print the same dates. */
const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** 1048576 → "1 MB", in en-US. */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return new Intl.NumberFormat("en-US", {
    style: "unit",
    unit: UNITS[unit],
    unitDisplay: unit === 0 ? "long" : "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

const KINDS: { test: RegExp; label: string; Icon: typeof FileIcon }[] = [
  { test: /\.(png|jpe?g|gif|webp|avif|svg)$/i, label: "Image", Icon: ImageIcon },
  { test: /\.(pdf|docx?|md|txt|rtf)$/i, label: "Document", Icon: FileTextIcon },
  { test: /\.(zip|rar|7z|tar|gz)$/i, label: "Archive", Icon: FileArchiveIcon },
  { test: /\.(psd|clip|kra|xcf)$/i, label: "Artwork", Icon: FileIcon },
];

/** A file's kind and icon, by its extension. */
export function fileKind(name: string): { label: string; Icon: typeof FileIcon } {
  return KINDS.find((kind) => kind.test.test(name)) ?? { label: "File", Icon: FileIcon };
}

/** Why a new name cannot be used in this folder, or an empty string when it can. */
export function renameProblem(name: string, current: string, siblings: string[]): string {
  const next = name.trim();
  if (!next) return "Enter a name.";
  if (/[/\\]/.test(next)) return "A name cannot contain / or \\.";
  const lower = next.toLocaleLowerCase("en-US");
  if (
    lower !== current.toLocaleLowerCase("en-US") &&
    siblings.some((s) => s.toLocaleLowerCase("en-US") === lower)
  ) {
    return `${next} is already in this folder.`;
  }
  return "";
}

interface FolderEntry {
  folder: FileManagerFolder;
  parentId: string | null;
}

function indexFolders(folders: FileManagerFolder[]) {
  const index = new Map<string, FolderEntry>();
  const walk = (list: FileManagerFolder[], parentId: string | null) => {
    for (const folder of list) {
      index.set(folder.id, { folder, parentId });
      walk(folder.children ?? [], folder.id);
    }
  };
  walk(folders, null);
  return index;
}

const toTreeNodes = (folders: FileManagerFolder[]): TreeNode[] =>
  folders.map((folder) => ({
    id: folder.id,
    label: folder.name,
    icon: <FolderIcon />,
    children: folder.children ? toTreeNodes(folder.children) : undefined,
  }));

export interface FileManagerProps extends React.ComponentProps<"div"> {
  /** The folder tree. */
  folders: FileManagerFolder[];
  /** The files at first; the component keeps them in its state from then on. */
  defaultFiles: FileManagerFile[];
  /** The id of the folder open at first; the first folder when left out. */
  defaultFolder?: string;
  /** Called with every file after each rename, delete or upload. */
  onFilesChange?: (files: FileManagerFile[]) => void;
}

export function FileManager({
  folders,
  defaultFiles,
  defaultFolder,
  onFilesChange,
  className,
  ...props
}: FileManagerProps) {
  const id = React.useId();
  const index = React.useMemo(() => indexFolders(folders), [folders]);
  const nodes = React.useMemo(() => toTreeNodes(folders), [folders]);
  const ancestors = React.useCallback(
    (folderId: string) => {
      const chain: FileManagerFolder[] = [];
      for (
        let at = index.get(folderId);
        at;
        at = at.parentId ? index.get(at.parentId) : undefined
      ) {
        chain.unshift(at.folder);
      }
      return chain;
    },
    [index],
  );

  const startId = defaultFolder && index.has(defaultFolder) ? defaultFolder : folders[0]?.id;
  const [folderId, setFolderId] = React.useState(startId);
  const [expanded, setExpanded] = React.useState(() =>
    startId ? ancestors(startId).map((folder) => folder.id) : [],
  );
  const [files, setFilesState] = React.useState(defaultFiles);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [problem, setProblem] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<FileManagerFile | null>(null);
  const [announcement, setAnnouncement] = React.useState({ key: 0, text: "" });
  const announce = (text: string) => setAnnouncement((last) => ({ key: last.key + 1, text }));

  const triggers = React.useRef(new Map<string, HTMLElement>());
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const renameRef = React.useRef<HTMLInputElement>(null);
  // Set when a menu item hands focus elsewhere (the rename box, the dialog), so the menu does not
  // take it back to its trigger as it closes.
  const menuHandsOff = React.useRef(false);
  // Where focus goes when the delete dialog closes: the row's button, or the list's heading.
  const afterDialog = React.useRef<HTMLElement | null>(null);
  const added = React.useRef(0);

  const setFiles = (next: FileManagerFile[]) => {
    setFilesState(next);
    onFilesChange?.(next);
  };

  const folder = folderId ? index.get(folderId)?.folder : undefined;
  const path = folderId ? ancestors(folderId) : [];
  const subfolders = folder?.children ?? [];
  const contents = files.filter((file) => file.folderId === folderId);
  const itemCount = subfolders.length + contents.length;

  const open = (next: string) => {
    const entry = index.get(next);
    if (!entry) return;
    setFolderId(next);
    setRenaming(null);
    setExpanded((current) =>
      Array.from(
        new Set([
          ...current,
          ...ancestors(next)
            .slice(0, -1)
            .map((f) => f.id),
        ]),
      ),
    );
    const count =
      (entry.folder.children?.length ?? 0) + files.filter((file) => file.folderId === next).length;
    announce(`${entry.folder.name} opened, ${count === 1 ? "1 item" : `${count} items`}`);
  };

  // The rename box takes focus when it appears, its name selected up to the extension.
  React.useEffect(() => {
    const input = renameRef.current;
    if (!renaming || !input) return;
    input.focus();
    const dot = input.value.lastIndexOf(".");
    input.setSelectionRange(0, dot > 0 ? dot : input.value.length);
  }, [renaming]);

  const startRename = (file: FileManagerFile) => {
    menuHandsOff.current = true;
    setRenaming(file.id);
    setDraft(file.name);
    setProblem("");
  };

  const endRename = (file: FileManagerFile) => {
    setRenaming(null);
    setProblem("");
    triggers.current.get(file.id)?.focus();
  };

  const commitRename = (file: FileManagerFile) => {
    const siblings = [
      ...subfolders.map((f) => f.name),
      ...contents.filter((f) => f.id !== file.id).map((f) => f.name),
    ];
    const found = renameProblem(draft, file.name, siblings);
    if (found) {
      setProblem(found);
      announce(found);
      return;
    }
    const name = draft.trim();
    if (name !== file.name) {
      setFiles(files.map((entry) => (entry.id === file.id ? { ...entry, name } : entry)));
      announce(`${file.name} renamed to ${name}`);
    }
    endRename(file);
  };

  const askDelete = (file: FileManagerFile) => {
    menuHandsOff.current = true;
    afterDialog.current = triggers.current.get(file.id) ?? null;
    setDeleteTarget(file);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setFiles(files.filter((file) => file.id !== deleteTarget.id));
    afterDialog.current = headingRef.current;
    setDeleteOpen(false);
    announce(`${deleteTarget.name} deleted`);
  };

  const addFiles = (incoming: File[]) => {
    if (!folderId || incoming.length === 0) return;
    const entries = incoming.map((file) => {
      added.current += 1;
      return {
        id: `${folderId}/added-${added.current}`,
        folderId,
        name: file.name,
        size: file.size,
        modified: new Date(file.lastModified).toISOString(),
      };
    });
    setFiles([...files, ...entries]);
  };

  const headingId = `${id}-heading`;
  const foldersId = `${id}-folders`;
  const problemId = `${id}-rename-problem`;
  const folderName = folder?.name ?? "this folder";

  const tree = (props: { "aria-label"?: string; "aria-labelledby"?: string }) => (
    <TreeView
      items={nodes}
      expanded={expanded}
      onExpandedChange={setExpanded}
      selected={folderId ?? null}
      onSelectedChange={open}
      {...props}
    />
  );

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4", className)} {...props}>
      <Breadcrumb>
        <BreadcrumbList>
          {path.map((crumb, at) => (
            <React.Fragment key={crumb.id}>
              {at > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {at === path.length - 1 ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<button type="button" />}
                    className="cursor-pointer"
                    onClick={() => open(crumb.id)}
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid min-w-0 gap-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
        {/* Phones: the tree folds away above the list. */}
        <Collapsible className="flex min-w-0 flex-col gap-2 md:hidden">
          <CollapsibleTrigger
            render={<Button variant="outline" className="w-full justify-between" />}
          >
            Folders
            <ChevronDownIcon
              aria-hidden="true"
              className="transition-transform in-aria-expanded:rotate-180 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>{tree({ "aria-label": "Folders" })}</CollapsibleContent>
        </Collapsible>
        {/* Tablets and up: the tree is a column beside the list. */}
        <section aria-labelledby={foldersId} className="hidden min-w-0 flex-col gap-2 md:flex">
          <h2 id={foldersId} className="text-sm font-medium text-muted-foreground">
            Folders
          </h2>
          {tree({ "aria-labelledby": foldersId })}
        </section>

        <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
          <FileUpload
            name="files"
            value={[]}
            onValueChange={addFiles}
            locale="en-US"
            labels={{
              dropzone: `Drop files here to add them to ${folderName}.`,
              added: (count) =>
                `${count === 1 ? "1 file" : `${count} files`} added to ${folderName}`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id={headingId}
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-lg uppercase outline-none"
              >
                {folderName}
              </h2>
              <FileUploadTrigger size="sm">
                <UploadIcon data-icon="inline-start" aria-hidden="true" />
                Upload
              </FileUploadTrigger>
            </div>
            <FileUploadDropzone className="items-stretch gap-2 p-2 text-left">
              {itemCount === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia />
                    <EmptyTitle>This folder is empty</EmptyTitle>
                    <EmptyDescription>Drop files here, or upload them.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table label={`${folderName}, contents`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden xl:table-cell">Kind</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="hidden md:table-cell">Modified</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subfolders.map((sub) => {
                      const count =
                        (sub.children?.length ?? 0) +
                        files.filter((file) => file.folderId === sub.id).length;
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="w-full max-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
                              <div className="flex min-w-0 flex-col items-start">
                                <Button
                                  variant="link"
                                  className="h-auto max-w-full justify-start p-0"
                                  onClick={() => open(sub.id)}
                                >
                                  <span className="truncate">{sub.name}</span>
                                </Button>
                                <span className="text-xs text-muted-foreground xl:hidden">
                                  Folder
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">Folder</TableCell>
                          <TableCell className="text-right whitespace-nowrap tabular-nums">
                            {count === 1 ? "1 item" : `${count} items`}
                          </TableCell>
                          <TableCell className="hidden md:table-cell" />
                          <TableCell />
                        </TableRow>
                      );
                    })}
                    {contents.map((file) => {
                      const kind = fileKind(file.name);
                      const date = DATE.format(new Date(file.modified));
                      const editing = renaming === file.id;
                      return (
                        <TableRow key={file.id}>
                          <TableCell className="w-full max-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <kind.Icon aria-hidden="true" className="size-4 shrink-0" />
                              <div className="flex min-w-0 flex-1 flex-col">
                                {editing ? (
                                  <>
                                    <Input
                                      ref={renameRef}
                                      name="name"
                                      aria-label={`New name for ${file.name}`}
                                      autoComplete="off"
                                      value={draft}
                                      onChange={(event) => {
                                        setDraft(event.target.value);
                                        setProblem("");
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          commitRename(file);
                                        } else if (event.key === "Escape") {
                                          event.preventDefault();
                                          endRename(file);
                                        }
                                      }}
                                      aria-invalid={problem ? true : undefined}
                                      aria-describedby={problem ? problemId : undefined}
                                      className="h-7"
                                    />
                                    {problem ? (
                                      <span id={problemId} className="text-xs text-destructive">
                                        {problem}
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="truncate" title={file.name}>
                                    {file.name}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground xl:hidden">
                                  {kind.label}
                                  <span className="md:hidden"> · {date}</span>
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">{kind.label}</TableCell>
                          <TableCell className="text-right whitespace-nowrap tabular-nums">
                            {formatFileSize(file.size)}
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap md:table-cell">
                            {date}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                ref={(element: HTMLElement | null) => {
                                  if (element) triggers.current.set(file.id, element);
                                  else triggers.current.delete(file.id);
                                }}
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Actions for ${file.name}`}
                                  />
                                }
                              >
                                <MoreHorizontalIcon aria-hidden="true" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                finalFocus={() => {
                                  const restore = !menuHandsOff.current;
                                  menuHandsOff.current = false;
                                  return restore;
                                }}
                              >
                                <DropdownMenuItem onClick={() => startRename(file)}>
                                  <PencilIcon aria-hidden="true" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => announce(`Downloading ${file.name}`)}
                                >
                                  <DownloadIcon aria-hidden="true" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => askDelete(file)}
                                >
                                  <Trash2Icon aria-hidden="true" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </FileUploadDropzone>
          </FileUpload>
        </section>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent finalFocus={() => afterDialog.current ?? true}>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It leaves {folderName} for good. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div role="status" className="sr-only">
        <span key={announcement.key}>{announcement.text}</span>
      </div>
    </div>
  );
}
