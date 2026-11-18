"use client";

import { cn } from "cn";
import { XIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// mangacn's file upload (SPEC-components-7 §4.7): a drop zone with a real file button, a list
// and per-file progress. It uploads nothing: the app sends the files and passes progress back
// through FileUploadItem. The drop zone is never the only way in: the trigger opens the native
// file dialog through a visually hidden <input type="file">, which also posts with a form.

export interface FileRejection {
  file: File;
  reason: "type" | "size" | "count";
}

/** Every word the upload shows or announces. */
export interface FileUploadLabels {
  /**
   * The drop zone's instructions, which also name its group.
   * @default "Drag and drop files here, or choose them."
   */
  dropzone?: string;
  /**
   * The trigger's text when it has no children.
   * @default "Choose files" ("Choose a file" when `multiple` is false)
   */
  trigger?: string;
  /**
   * Each row's remove button.
   * @default (name) => `Remove ${name}`
   */
  remove?: (name: string) => string;
  /**
   * Announced after files are added.
   * @default (n) => `${n} file(s) added`
   */
  added?: (count: number) => string;
  /**
   * Announced for each rejected file; `reason` is one of the three below.
   * @default (name, reason) => `${name} was not added: ${reason}`
   */
  rejected?: (name: string, reason: string) => string;
  /** @default "not an accepted file type" */
  type?: string;
  /** @default (max) => `larger than ${max}` */
  size?: (max: string) => string;
  /** @default (max) => `more than ${max} files` */
  count?: (max: number) => string;
}

const DEFAULT_LABELS: Required<Omit<FileUploadLabels, "trigger">> = {
  dropzone: "Drag and drop files here, or choose them.",
  remove: (name) => `Remove ${name}`,
  added: (count) => (count === 1 ? "1 file added" : `${count} files added`),
  rejected: (name, reason) => `${name} was not added: ${reason}`,
  type: "not an accepted file type",
  size: (max) => `larger than ${max}`,
  count: (max) => (max === 1 ? "more than 1 file" : `more than ${max} files`),
};

export interface FileUploadProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** The accepted files. Controlled. */
  value?: File[];
  /** The starting files when uncontrolled. */
  defaultValue?: File[];
  /** Called with the accepted files after each add or remove. */
  onValueChange?: (files: File[]) => void;
  /** The types to accept, as `<input accept>` takes them: "image/*,.pdf". */
  accept?: string;
  /**
   * Accepts several files; when false a new file replaces the current one.
   * @default true
   */
  multiple?: boolean;
  /** The most files the value may hold; extra files are rejected with reason "count". */
  maxFiles?: number;
  /** The largest file in bytes; larger files are rejected with reason "size". */
  maxSize?: number;
  /** Called with the files a choice or a drop rejected, and why. */
  onReject?: (rejections: FileRejection[]) => void;
  /**
   * Stops choosing, dropping and removing.
   * @default false
   */
  disabled?: boolean;
  /** The native input's name, so a plain form posts the files. */
  name?: string;
  /** Overrides every word the upload shows or announces. */
  labels?: FileUploadLabels;
  /**
   * Formats file sizes and the `maxSize` reason (Intl); fixed so server and browser agree.
   * @default "en-US"
   */
  locale?: string;
}

interface FileUploadContextValue {
  files: File[];
  rejections: FileRejection[];
  addFiles: (incoming: File[]) => void;
  remove: (file: File) => void;
  openDialog: () => void;
  disabled: boolean;
  multiple: boolean;
  labels: Required<FileUploadLabels>;
  reasonText: (rejection: FileRejection) => string;
  locale: string;
}

const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

function useFileUpload(part: string) {
  const context = React.useContext(FileUploadContext);
  if (!context) throw new Error(`${part} must be used inside <FileUpload>`);
  return context;
}

/** "image/*,.png" against a file's type and name, as the native dialog filters. */
function accepts(file: File, accept: string | undefined) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith(".")) return name.endsWith(token);
      if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
}

// A stable React key per File object: two files may share a name.
const fileKeys = new WeakMap<File, number>();
let nextFileKey = 0;
function fileKey(file: File): number {
  let key = fileKeys.get(file);
  if (key === undefined) {
    key = nextFileKey++;
    fileKeys.set(file, key);
  }
  return key;
}

const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** 1048576 → "1 MB", through Intl in the given locale. */
function formatFileSize(bytes: number, locale: string): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: UNITS[unit],
    unitDisplay: unit === 0 ? "long" : "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

export function FileUpload({
  value: valueProp,
  defaultValue,
  onValueChange,
  accept,
  multiple = true,
  maxFiles,
  maxSize,
  onReject,
  disabled = false,
  name,
  labels: labelsProp,
  locale = "en-US",
  className,
  children,
  ...props
}: FileUploadProps) {
  const [uncontrolled, setUncontrolled] = React.useState<File[]>(defaultValue ?? []);
  const files = valueProp ?? uncontrolled;
  const [rejections, setRejections] = React.useState<FileRejection[]>([]);
  const [message, setMessage] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const labels: Required<FileUploadLabels> = {
    ...DEFAULT_LABELS,
    trigger: multiple ? "Choose files" : "Choose a file",
    ...labelsProp,
  };
  const limit = multiple ? maxFiles : 1;
  const reasonText = (rejection: FileRejection) =>
    rejection.reason === "type"
      ? labels.type
      : rejection.reason === "size"
        ? labels.size(formatFileSize(maxSize ?? 0, locale))
        : labels.count(limit ?? 0);

  // Keep the native input's files equal to the value, so a form posts dropped files too, and
  // not removed or rejected ones. Browsers without a DataTransfer constructor keep the last
  // dialog choice.
  const syncInput = (list: File[]) => {
    const input = inputRef.current;
    if (!input || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    for (const file of list) transfer.items.add(file);
    input.files = transfer.files;
  };

  const commit = (next: File[]) => {
    if (valueProp === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const addFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    // A single upload replaces its file, so only the incoming files count against the limit.
    const kept = multiple ? files : [];
    for (const file of incoming) {
      if (!accepts(file, accept)) rejected.push({ file, reason: "type" });
      else if (maxSize !== undefined && file.size > maxSize)
        rejected.push({ file, reason: "size" });
      else if (limit !== undefined && kept.length + accepted.length >= limit)
        rejected.push({ file, reason: "count" });
      else accepted.push(file);
    }
    const next = accepted.length > 0 ? [...kept, ...accepted] : files;
    if (accepted.length > 0) commit(next);
    // A fully rejected choice leaves the value as it was, but the dialog has already replaced the
    // input's files: put the value back, so the form never posts a rejected file.
    syncInput(next);
    setRejections(rejected);
    if (rejected.length > 0) onReject?.(rejected);
    setMessage(
      [
        accepted.length > 0 ? labels.added(accepted.length) : "",
        ...rejected.map((rejection) => labels.rejected(rejection.file.name, reasonText(rejection))),
      ]
        .filter(Boolean)
        .join(". "),
    );
  };

  const remove = (file: File) => {
    if (disabled) return;
    if (files.includes(file)) commit(files.filter((candidate) => candidate !== file));
    setRejections((current) => current.filter((rejection) => rejection.file !== file));
  };

  // A controlled value can also change from outside (a reset, a parent that refuses a file).
  // biome-ignore lint/correctness/useExhaustiveDependencies: syncInput only reads the ref.
  React.useEffect(() => syncInput(files), [files]);

  const context: FileUploadContextValue = {
    files,
    rejections,
    addFiles,
    remove,
    openDialog: () => inputRef.current?.click(),
    disabled,
    multiple,
    labels,
    reasonText,
    locale,
  };

  return (
    <FileUploadContext.Provider value={context}>
      <div
        data-slot="file-upload"
        data-disabled={disabled ? "" : undefined}
        className={cn("flex w-full min-w-0 flex-col gap-3", className)}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
        />
        {children}
        <div aria-live="polite" className="sr-only">
          {message}
        </div>
      </div>
    </FileUploadContext.Provider>
  );
}

export type FileUploadDropzoneProps = React.ComponentProps<"div">;

/** A labelled group that takes dropped files; its instructions also name it. */
export function FileUploadDropzone({
  className,
  children,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: FileUploadDropzoneProps) {
  const { addFiles, disabled, labels } = useFileUpload("FileUploadDropzone");
  const [dragging, setDragging] = React.useState(false);
  const textId = React.useId();

  const over = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.type === "dragenter") onDragEnter?.(event);
    else onDragOver?.(event);
    // A consumer's handler runs first; the zone's own handling always follows.
    if (disabled) return;
    event.preventDefault();
    setDragging(true);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a drop zone is a labelled group, not a fieldset.
    <div
      role="group"
      aria-labelledby={textId}
      data-slot="file-upload-dropzone"
      data-dragging={dragging ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "relative isolate flex w-full min-w-0 flex-col items-center justify-center gap-3 px-4 py-8 text-center text-sm",
        "data-disabled:text-muted-foreground",
        className,
      )}
      onDragEnter={over}
      onDragOver={over}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        event.preventDefault();
        setDragging(false);
        if (!disabled) addFiles(Array.from(event.dataTransfer.files));
      }}
      {...props}
    >
      <InkFrame
        as="span"
        dashed
        fill={dragging ? "hatch" : disabled ? "none" : "paper"}
        className={cn(
          "pointer-events-none absolute inset-0 -z-1 rounded-lg",
          disabled && "halftone-light",
        )}
      />
      <p id={textId} className="text-muted-foreground">
        {labels.dropzone}
      </p>
      {children}
    </div>
  );
}

export type FileUploadTriggerProps = React.ComponentProps<typeof Button>;

/** A button that opens the native file dialog; `id` and `aria-*` make it a field's control. */
export function FileUploadTrigger({ children, onClick, ...props }: FileUploadTriggerProps) {
  const { openDialog, disabled, labels } = useFileUpload("FileUploadTrigger");
  return (
    <Button
      type="button"
      variant="outline"
      data-slot="file-upload-trigger"
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openDialog();
      }}
      {...props}
    >
      {children ?? labels.trigger}
    </Button>
  );
}

export type FileUploadListProps = React.ComponentProps<"ul">;

/**
 * The rows: its children, or one FileUploadItem per accepted file when it has none. Rejected
 * files follow as error rows with their reason, until the next add or their remove.
 */
export function FileUploadList({ className, children, ...props }: FileUploadListProps) {
  const { files, rejections, reasonText } = useFileUpload("FileUploadList");
  if (files.length === 0 && rejections.length === 0 && React.Children.count(children) === 0) {
    return null;
  }
  return (
    <ul
      data-slot="file-upload-list"
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      {...props}
    >
      {children ?? files.map((file) => <FileUploadItem key={fileKey(file)} file={file} />)}
      {rejections.map((rejection) => (
        <FileUploadItem
          key={`rejected-${fileKey(rejection.file)}`}
          file={rejection.file}
          status="error"
          error={reasonText(rejection)}
        />
      ))}
    </ul>
  );
}

export interface FileUploadItemProps extends React.ComponentProps<"li"> {
  /** The file this row shows. */
  file: File;
  /** Upload progress, 0–100, drawn with mangacn `progress` and named by the file. */
  progress?: number;
  /**
   * The row's state: `error` shows `error` in spot in place of the progress.
   * @default "idle"
   */
  status?: "idle" | "uploading" | "done" | "error";
  /** Why the upload failed, shown in spot when `status` is "error". */
  error?: string;
}

export function FileUploadItem({
  file,
  progress,
  status = "idle",
  error,
  className,
  children,
  ...props
}: FileUploadItemProps) {
  const { remove, disabled, labels, locale } = useFileUpload("FileUploadItem");
  const nameId = React.useId();
  const showProgress = status !== "error" && (progress !== undefined || status === "uploading");
  const value = status === "done" ? 100 : Math.min(100, Math.max(0, progress ?? 0));

  return (
    <li
      data-slot="file-upload-item"
      data-status={status}
      className={cn(
        "relative isolate grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 px-3 py-2 text-sm",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        fill="paper"
        className={cn(
          "pointer-events-none absolute inset-0 -z-1 rounded-md",
          status === "error" && "[--ink:var(--spot)]",
        )}
      />
      <span
        id={nameId}
        data-slot="file-upload-item-name"
        title={file.name}
        className="min-w-0 truncate font-medium"
      >
        {file.name}
      </span>
      <span
        data-slot="file-upload-item-size"
        className="text-xs whitespace-nowrap text-muted-foreground tabular-nums"
      >
        {formatFileSize(file.size, locale)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        data-slot="file-upload-item-remove"
        aria-label={labels.remove(file.name)}
        disabled={disabled}
        onClick={() => remove(file)}
      >
        <XIcon />
      </Button>
      {showProgress ? (
        <Progress
          value={value}
          aria-labelledby={nameId}
          getAriaValueText={(_formatted, current) => `${Math.round(current ?? 0)}%`}
          data-slot="file-upload-item-progress"
          className="col-span-3"
        />
      ) : null}
      {status === "error" && error ? (
        <span className="col-span-3 text-xs text-spot">{error}</span>
      ) : null}
      {children}
    </li>
  );
}
