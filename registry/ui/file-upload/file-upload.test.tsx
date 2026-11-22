import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadList,
  type FileUploadProps,
  FileUploadTrigger,
} from "./file-upload";

afterEach(cleanup);

const file = (name: string, bytes = 10, type = "image/png") =>
  new File([new Uint8Array(bytes)], name, { type });

function Example(props: Partial<FileUploadProps>) {
  return (
    <FileUpload name="pages" {...props}>
      <FileUploadDropzone>
        <FileUploadTrigger />
      </FileUploadDropzone>
      <FileUploadList />
    </FileUpload>
  );
}

const nativeInput = () => document.querySelector<HTMLInputElement>('input[type="file"]');
const choose = (...files: File[]) => {
  const input = nativeInput();
  if (!input) throw new Error("no input");
  fireEvent.change(input, { target: { files } });
};
const dropzone = () => screen.getByRole("group");
const rows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-slot="file-upload-item"]'));
const live = () => document.querySelector('[aria-live="polite"]');

function Controlled() {
  const [files, setFiles] = React.useState<File[]>([file("cover.png")]);
  return (
    <>
      <Example value={files} onValueChange={setFiles} />
      <button type="button" onClick={() => setFiles([])}>
        Clear
      </button>
    </>
  );
}

describe("FileUpload", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  it("renders its parts with slots; the drop zone is a group named by its instructions", () => {
    const { container } = render(<Example defaultValue={[file("a.png")]} />);
    expect(container.querySelector('[data-slot="file-upload"]')).not.toBeNull();
    const group = screen.getByRole("group", { name: "Drag and drop files here, or choose them." });
    expect(group.dataset.slot).toBe("file-upload-dropzone");
    expect(screen.getByRole("button", { name: "Choose files" }).dataset.slot).toBe(
      "file-upload-trigger",
    );
    for (const slot of [
      "file-upload-list",
      "file-upload-item",
      "file-upload-item-name",
      "file-upload-item-size",
      "file-upload-item-remove",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("the trigger opens the visually hidden native input, which carries name and accept", () => {
    render(<Example accept="image/*" />);
    const input = nativeInput();
    expect(input?.name).toBe("pages");
    expect(input?.accept).toBe("image/*");
    expect(input?.multiple).toBe(true);
    expect(input?.className).toContain("sr-only");
    expect(input?.tabIndex).toBe(-1);
    const click = vi.spyOn(input as HTMLInputElement, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Choose files" }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("is uncontrolled: chosen files are listed with name and size and announced", () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    expect(screen.queryByRole("list")).toBeNull();
    const a = file("page-01.png", 2048);
    const b = file("page-02.png");
    choose(a, b);
    expect(onValueChange).toHaveBeenLastCalledWith([a, b]);
    expect(rows()).toHaveLength(2);
    expect(screen.getByText("page-01.png").getAttribute("title")).toBe("page-01.png");
    expect(rows()[0].querySelector('[data-slot="file-upload-item-size"]')?.textContent).toMatch(
      /^2\s?kB$/i,
    );
    expect(live()?.textContent).toBe("2 files added");
    choose(file("page-03.png"));
    expect(rows()).toHaveLength(3);
    expect(live()?.textContent).toBe("1 file added");
  });

  it("is controlled by value", () => {
    render(<Controlled />);
    expect(rows()).toHaveLength(1);
    choose(file("back.png"));
    expect(rows()).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(rows()).toHaveLength(0);
  });

  it("takes dropped files and marks the zone while dragging", () => {
    render(<Example />);
    fireEvent.dragEnter(dropzone());
    expect(dropzone().hasAttribute("data-dragging")).toBe(true);
    expect(dropzone().querySelector('[data-slot="ink-frame"]')?.getAttribute("data-fill")).toBe(
      "hatch",
    );
    fireEvent.dragLeave(dropzone(), { relatedTarget: document.body });
    expect(dropzone().hasAttribute("data-dragging")).toBe(false);
    fireEvent.dragOver(dropzone());
    fireEvent.drop(dropzone(), { dataTransfer: { files: [file("dropped.png")] } });
    expect(dropzone().hasAttribute("data-dragging")).toBe(false);
    expect(screen.getByText("dropped.png")).toBeTruthy();
  });

  it("runs a consumer's drag and drop handlers before its own", () => {
    const onDrop = vi.fn();
    const onDragOver = vi.fn();
    render(
      <FileUpload>
        <FileUploadDropzone onDrop={onDrop} onDragOver={onDragOver} />
        <FileUploadList />
      </FileUpload>,
    );
    fireEvent.dragOver(dropzone());
    expect(onDragOver).toHaveBeenCalledTimes(1);
    expect(dropzone().hasAttribute("data-dragging")).toBe(true);
    fireEvent.drop(dropzone(), { dataTransfer: { files: [file("mine.png")] } });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(screen.getByText("mine.png")).toBeTruthy();
  });

  it("rejects by type, size and count with reasons, listed in spot and announced", () => {
    const onReject = vi.fn();
    render(<Example accept="image/*,.pdf" maxSize={1024} maxFiles={2} onReject={onReject} />);
    const ok = file("ok.png");
    const doc = file("notes.pdf", 10, "application/pdf");
    const text = file("notes.txt", 10, "text/plain");
    const big = file("big.png", 4096);
    const extra = file("extra.png");
    choose(ok, text, big, doc, extra);
    expect(onReject).toHaveBeenCalledWith([
      { file: text, reason: "type" },
      { file: big, reason: "size" },
      { file: extra, reason: "count" },
    ]);
    const rejected = rows().filter((row) => row.dataset.status === "error");
    expect(rejected.map((row) => row.textContent)).toEqual([
      expect.stringContaining("not an accepted file type"),
      expect.stringMatching(/larger than 1\s?kB/i),
      expect.stringContaining("more than 2 files"),
    ]);
    expect(screen.getByText("not an accepted file type").className).toContain("text-spot");
    expect(live()?.textContent).toMatch(
      /^2 files added\. notes\.txt was not added: not an accepted file type\. big\.png was not added: larger than 1\s?kB\. extra\.png was not added: more than 2 files$/i,
    );
    // Removing a rejected row dismisses it.
    fireEvent.click(screen.getByRole("button", { name: "Remove big.png" }));
    expect(screen.queryByText("big.png")).toBeNull();
  });

  it("announces the same message twice in a row: clears the live region, then sets it", () => {
    vi.useFakeTimers();
    try {
      render(<Example accept="image/*" />);
      choose(file("notes.txt", 10, "text/plain"));
      const message = live()?.textContent;
      expect(message).toBe("notes.txt was not added: not an accepted file type");
      choose(file("notes.txt", 10, "text/plain"));
      expect(live()?.textContent).toBe("");
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(live()?.textContent).toBe(message);
    } finally {
      vi.useRealTimers();
    }
  });

  it("replaces its one file when multiple is false", () => {
    render(<Example multiple={false} />);
    expect(nativeInput()?.multiple).toBe(false);
    expect(screen.getByRole("button", { name: "Choose a file" })).toBeTruthy();
    choose(file("one.png"));
    choose(file("two.png"));
    expect(rows().map((row) => row.dataset.slot && row.textContent)).toEqual([
      expect.stringContaining("two.png"),
    ]);
  });

  it("each row's remove button names the file and removes it", () => {
    const onValueChange = vi.fn();
    const a = file("a.png");
    const b = file("b.png");
    render(<Example defaultValue={[a, b]} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove a.png" }));
    expect(onValueChange).toHaveBeenLastCalledWith([b]);
    expect(rows()).toHaveLength(1);
  });

  it("shows progress named by the file with a value text, and an error in spot", () => {
    const a = file("a.png");
    const b = file("b.png");
    render(
      <FileUpload value={[a, b]}>
        <FileUploadList>
          <FileUploadItem file={a} progress={40} status="uploading" />
          <FileUploadItem file={b} status="error" error="Server said no" />
        </FileUploadList>
      </FileUpload>,
    );
    const bar = screen.getByRole("progressbar", { name: "a.png" });
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuetext")).toBe("40%");
    expect(bar.closest('[data-slot="file-upload-item-progress"]')).not.toBeNull();
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    expect(screen.getByText("Server said no").className).toContain("text-spot");
    expect(rows()[1].dataset.status).toBe("error");
  });

  it("does nothing when disabled", () => {
    const onValueChange = vi.fn();
    render(<Example disabled defaultValue={[file("a.png")]} onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "Choose files" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(nativeInput()?.disabled).toBe(true);
    fireEvent.drop(dropzone(), { dataTransfer: { files: [file("b.png")] } });
    fireEvent.click(screen.getByRole("button", { name: "Remove a.png" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(dropzone().hasAttribute("data-disabled")).toBe(true);
  });

  it("works as a field's control: id and aria-describedby land on the trigger", () => {
    render(
      <>
        <label htmlFor="up">Cover</label>
        <FileUpload>
          <FileUploadTrigger id="up" aria-describedby="hint" aria-invalid />
        </FileUpload>
        <p id="hint">PNG only</p>
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Cover" });
    expect(trigger.id).toBe("up");
    expect(trigger.getAttribute("aria-describedby")).toBe("hint");
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
  });

  it("labels override every word", () => {
    render(
      <Example
        maxFiles={1}
        labels={{
          dropzone: "Déposez ici",
          trigger: "Parcourir",
          remove: (name) => `Retirer ${name}`,
          added: (n) => `${n} ajouté(s)`,
          rejected: (name, reason) => `${name} refusé : ${reason}`,
          count: (max) => `plus de ${max}`,
        }}
      />,
    );
    expect(screen.getByRole("group", { name: "Déposez ici" })).toBeTruthy();
    choose(file("a.png"), file("b.png"));
    expect(screen.getByRole("button", { name: "Parcourir" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retirer a.png" })).toBeTruthy();
    expect(live()?.textContent).toBe("1 ajouté(s). b.png refusé : plus de 1");
  });
});
