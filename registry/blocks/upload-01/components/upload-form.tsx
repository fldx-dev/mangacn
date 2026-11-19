"use client";

import { cn } from "cn";
import { TriangleAlertIcon } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UPLOAD_MAX_FILES, UPLOAD_MAX_SIZE, type UploadSeries } from "./upload-data";

// A chapter upload in one card: the series, number and title, then the pages. Nothing is sent:
// "Upload" runs a simulated upload in this component (a timer started by the click, never by a
// render, and cleared by Cancel and on unmount); a page whose name contains "error" fails on its
// first try, to show the error row and its Retry. Publish checks the fields once every page is
// done; pass `onPublish` to send the chapter, and replace the timer with your own upload.

type PageStatus = "idle" | "uploading" | "done" | "error";

interface PageUpload {
  progress: number;
  status: PageStatus;
  /** How many times this page has started uploading. */
  attempts: number;
}

type UploadErrors = Partial<Record<"chapter" | "title", string>>;

/** What a valid Publish passes on. */
export interface PublishedChapter {
  seriesId: string;
  chapter: number;
  title: string;
}

const TICK_MS = 300;
const STEP = 25;
const FAILED = "The upload failed. Retry the page.";
const IDLE: PageUpload = { progress: 0, status: "idle", attempts: 0 };

/** The messages a failed Publish shows, by field; empty when the chapter can be published. */
export function validateChapter(chapter: number | null, title: string): UploadErrors {
  const errors: UploadErrors = {};
  if (chapter === null || chapter < 1) errors.chapter = "Enter a chapter number of 1 or more.";
  if (!title.trim()) errors.title = "Enter a chapter title.";
  return errors;
}

/** One tick of the simulated upload: every uploading page moves on, an "error" page fails once. */
function advance(current: Map<File, PageUpload>): Map<File, PageUpload> {
  const next = new Map(current);
  for (const [file, upload] of current) {
    if (upload.status !== "uploading") continue;
    const progress = Math.min(100, upload.progress + STEP);
    const fails = upload.attempts === 1 && /error/i.test(file.name) && progress >= 50;
    next.set(
      file,
      fails
        ? { ...upload, progress: 50, status: "error" }
        : { ...upload, progress, status: progress >= 100 ? "done" : "uploading" },
    );
  }
  return next;
}

export interface UploadFormProps extends React.ComponentProps<"div"> {
  /** The series the chapter can belong to; the first is picked to start. */
  series: UploadSeries[];
  /** Called with the chapter and its pages after a valid Publish. */
  onPublish?: (chapter: PublishedChapter, pages: File[]) => void;
}

export function UploadForm({ series, onPublish, className, ...props }: UploadFormProps) {
  const id = React.useId();
  const fieldId = (name: string) => `${id}-${name}`;
  const focus = (name: string) => document.getElementById(fieldId(name))?.focus();

  const [seriesId, setSeriesId] = React.useState(series[0]?.id ?? "");
  const [chapter, setChapter] = React.useState<number | null>(series[0]?.nextChapter ?? 1);
  const [title, setTitle] = React.useState("");
  const [errors, setErrors] = React.useState<UploadErrors>({});
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploads, setUploads] = React.useState<Map<File, PageUpload>>(() => new Map());
  const [running, setRunning] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // A new key per announcement, so the same text twice is announced twice.
  const [announcement, setAnnouncement] = React.useState({ key: 0, text: "" });
  const announce = (text: string) => setAnnouncement((last) => ({ key: last.key + 1, text }));

  const stopTimer = React.useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  }, []);
  React.useEffect(() => stopTimer, [stopTimer]);

  const pageOf = (file: File) => uploads.get(file) ?? IDLE;
  const total = files.length;
  const done = files.filter((file) => pageOf(file).status === "done").length;
  const failed = files.filter((file) => pageOf(file).status === "error").length;
  const waiting = files.filter((file) => pageOf(file).status === "idle");
  const summary = `${done} of ${total} ${total === 1 ? "page" : "pages"} uploaded`;

  // The run ends when no page is uploading any more: stop the timer and say how it went. The
  // map holds exactly the listed pages, so the counts come from it.
  React.useEffect(() => {
    if (!running) return;
    const pages = Array.from(uploads.values());
    if (pages.some((upload) => upload.status === "uploading")) return;
    stopTimer();
    setRunning(false);
    if (pages.length === 0) return;
    const doneCount = pages.filter((upload) => upload.status === "done").length;
    const failedCount = pages.filter((upload) => upload.status === "error").length;
    const text = `${doneCount} of ${pages.length} ${pages.length === 1 ? "page" : "pages"} uploaded.`;
    setAnnouncement((last) => ({
      key: last.key + 1,
      text: failedCount > 0 ? `${text} ${failedCount} failed.` : text,
    }));
  }, [running, uploads, stopTimer]);

  /** Starts (or restarts) the given pages and the timer, if it is not already running. */
  const start = (pages: File[]) => {
    if (pages.length === 0) return;
    setUploads((current) => {
      const next = new Map(current);
      for (const file of pages) {
        const upload = current.get(file) ?? IDLE;
        next.set(file, { progress: 0, status: "uploading", attempts: upload.attempts + 1 });
      }
      return next;
    });
    if (timer.current === null) {
      timer.current = setInterval(() => setUploads(advance), TICK_MS);
    }
    setRunning(true);
    announce(pages.length === 1 ? `Uploading ${pages[0].name}` : `Uploading ${pages.length} pages`);
  };

  const cancel = () => {
    stopTimer();
    setRunning(false);
    setUploads((current) => {
      const next = new Map(current);
      for (const [file, upload] of current) {
        if (upload.status === "uploading")
          next.set(file, { ...upload, progress: 0, status: "idle" });
      }
      return next;
    });
    announce("Upload cancelled");
  };

  const changeFiles = (next: File[]) => {
    setFiles(next);
    setUploads((current) => new Map(next.map((file) => [file, current.get(file) ?? IDLE])));
  };

  const changeSeries = (next: string) => {
    setSeriesId(next);
    const picked = series.find((entry) => entry.id === next);
    if (picked) setChapter(picked.nextChapter);
  };

  const publish = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateChapter(chapter, title);
    setErrors(found);
    const first = (["chapter", "title"] as const).find((key) => found[key]);
    if (first) {
      focus(first);
      return;
    }
    const number = chapter as number;
    onPublish?.({ seriesId, chapter: number, title: title.trim() }, files);
    announce(`Chapter ${number} published`);
  };

  const describedBy = (name: string, error?: string) =>
    error ? fieldId(`${name}-error`) : undefined;
  const heading = fieldId("heading");
  const canPublish = total > 0 && done === total;
  const options = series.map((entry) => ({ label: entry.title, value: entry.id }));

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-6", className)} {...props}>
      <section aria-labelledby={heading}>
        <Card>
          <form aria-labelledby={heading} noValidate onSubmit={publish} className="contents">
            <CardHeader>
              <CardTitle>
                <h2 id={heading} className="font-display text-lg uppercase">
                  New chapter
                </h2>
              </CardTitle>
              <CardDescription>
                Pick the series, number the chapter and add its pages in reading order.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FieldSet aria-labelledby={heading}>
                <FieldGroup>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={fieldId("series")}>
                        Series <span className="text-muted-foreground">(required)</span>
                      </FieldLabel>
                      <Select
                        name="series"
                        items={options}
                        value={seriesId}
                        onValueChange={(next) => {
                          if (typeof next === "string") changeSeries(next);
                        }}
                      >
                        <SelectTrigger id={fieldId("series")} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field data-invalid={errors.chapter ? true : undefined}>
                      <FieldLabel htmlFor={fieldId("chapter")}>
                        Chapter <span className="text-muted-foreground">(required)</span>
                      </FieldLabel>
                      <NumberInput
                        id={fieldId("chapter")}
                        name="chapter"
                        min={1}
                        required
                        locale="en-US"
                        value={chapter}
                        onValueChange={setChapter}
                        aria-invalid={errors.chapter ? true : undefined}
                        aria-describedby={describedBy("chapter", errors.chapter)}
                      />
                      <FieldError id={fieldId("chapter-error")}>{errors.chapter}</FieldError>
                    </Field>
                  </div>
                  <Field data-invalid={errors.title ? true : undefined}>
                    <FieldLabel htmlFor={fieldId("title")}>
                      Title <span className="text-muted-foreground">(required)</span>
                    </FieldLabel>
                    <Input
                      id={fieldId("title")}
                      name="title"
                      required
                      autoComplete="off"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      aria-invalid={errors.title ? true : undefined}
                      aria-describedby={describedBy("title", errors.title)}
                    />
                    <FieldError id={fieldId("title-error")}>{errors.title}</FieldError>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FileUpload
                name="pages"
                accept="image/*"
                maxFiles={UPLOAD_MAX_FILES}
                maxSize={UPLOAD_MAX_SIZE}
                locale="en-US"
                value={files}
                onValueChange={changeFiles}
                labels={{
                  dropzone: `Drag and drop the pages here: images up to 10 MB, ${UPLOAD_MAX_FILES} at most.`,
                  trigger: "Choose pages",
                }}
              >
                <FileUploadDropzone>
                  <FileUploadTrigger />
                </FileUploadDropzone>
                <FileUploadList>
                  {files.map((file) => {
                    const upload = pageOf(file);
                    return (
                      <FileUploadItem
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        file={file}
                        progress={upload.status === "idle" ? undefined : upload.progress}
                        status={upload.status}
                        error={upload.status === "error" ? FAILED : undefined}
                      >
                        {upload.status === "error" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="col-span-3 justify-self-start"
                            aria-label={`Retry ${file.name}`}
                            onClick={() => start([file])}
                          >
                            Retry
                          </Button>
                        ) : null}
                      </FileUploadItem>
                    );
                  })}
                </FileUploadList>
              </FileUpload>

              {total > 0 ? (
                <Progress
                  value={(done / total) * 100}
                  getAriaValueText={() => summary}
                  className="w-full"
                >
                  <ProgressLabel>Pages</ProgressLabel>
                  <ProgressValue>{() => summary}</ProgressValue>
                </Progress>
              ) : null}

              {failed > 0 && !running ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon aria-hidden="true" />
                  <AlertTitle>
                    {failed === 1 ? "1 page failed to upload" : `${failed} pages failed to upload`}
                  </AlertTitle>
                  <AlertDescription>
                    Retry it from its row, or remove it and add it again.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!running}
                onClick={cancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={running || waiting.length === 0}
                onClick={() => start(waiting)}
              >
                Upload
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={!canPublish}>
                Publish
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <div role="status" className="sr-only">
        <span key={announcement.key}>{announcement.text}</span>
      </div>
    </div>
  );
}
