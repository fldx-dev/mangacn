import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import { uploadSeries } from "./components/upload-data";
import { UploadForm, validateChapter } from "./components/upload-form";
import Page from "./page";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");
const announcer = () => screen.getAllByRole("status").at(-1) as HTMLElement;

function fileOf(name: string, type = "image/png", size = 800 * 1024) {
  const file = new File(["x"], name, { type, lastModified: 0 });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function pick(files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: files });
  fireEvent.change(input);
}

/** Twelve pages, the seventh named to fail on its first try. */
const twelvePages = () =>
  Array.from({ length: 12 }, (_, index) =>
    fileOf(index === 6 ? "ch13-p07-error.png" : `ch13-p${String(index + 1).padStart(2, "0")}.png`),
  );

const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("upload-01 page", () => {
  it("is one main with one h1 and a section holding a form named by its heading", () => {
    render(<Page />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Upload chapter",
    ]);
    const region = screen.getByRole("region", { name: "New chapter" });
    expect(within(region).getByRole("form", { name: "New chapter" })).toBeTruthy();
  });

  it("starts at the first series' next chapter, no pages, Publish off", () => {
    render(<Page />);
    expect(screen.getByLabelText(/Chapter/)).toHaveProperty("value", "13");
    expect(screen.getByRole("combobox", { name: /Series/ }).textContent).toContain(
      uploadSeries[0].title,
    );
    expect(document.querySelectorAll('[data-slot="file-upload-item"]')).toHaveLength(0);
    expect(button("Publish").disabled).toBe(true);
    expect(button("Upload").disabled).toBe(true);
    expect(button("Cancel").disabled).toBe(true);
  });

  it("names every input, so the form posts as a plain form", () => {
    render(<Page />);
    const form = screen.getByRole("form");
    for (const input of form.querySelectorAll("input, textarea")) {
      // number-input's text box is what the reader types in; it posts through a hidden input.
      if (input.getAttribute("data-slot") === "number-input-input") continue;
      expect(input.getAttribute("name"), input.outerHTML).toBeTruthy();
    }
    for (const name of ["series", "chapter", "title"]) {
      expect(form.querySelector(`input[name="${name}"]`), name).toBeTruthy();
    }
    const input = form.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.name).toBe("pages");
    expect(input.accept).toBe("image/*");
  });

  it("is a server page around a client form, importing it by install path once added", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/upload-form.tsx"))).toBe(true);
    expect(source("page.tsx")).toContain('from "./components/upload-form"');
    const installed = installedPageSource("upload-01");
    expect(installed).toContain('from "@/components/upload-form"');
    expect(installed).toContain('from "@/components/upload-data"');
  });

  it("reads no clock while rendering: the same markup at two dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 9));
    const first = renderToStaticMarkup(<Page />);
    vi.setSystemTime(new Date(2031, 6, 15, 23));
    expect(renderToStaticMarkup(<Page />)).toBe(first);
    for (const file of ["page.tsx", "components/upload-form.tsx", "components/upload-data.ts"]) {
      expect(source(file), file).not.toMatch(/new Date\(\)|Date\.now|Math\.random|randomUUID/);
    }
  });

  it("starts no timer on render", () => {
    vi.useFakeTimers();
    render(<Page />);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("draws nothing of its own", () => {
    for (const file of ["page.tsx", "components/upload-form.tsx"]) {
      expect(source(file), file).not.toMatch(/<svg|<img|shadow-|border-|text-spot|bg-spot/);
    }
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("UploadForm: the upload", () => {
  it("uploads twelve pages to done, fails the error page, retries it, then publishes", () => {
    vi.useFakeTimers();
    const onPublish = vi.fn();
    render(<UploadForm series={uploadSeries} onPublish={onPublish} />);
    pick(twelvePages());
    expect(document.querySelectorAll('[data-slot="file-upload-item"]')).toHaveLength(12);
    expect(screen.getByText("0 of 12 pages uploaded")).toBeTruthy();

    fireEvent.click(button("Upload"));
    expect(announcer().textContent).toBe("Uploading 12 pages");
    expect(button("Upload").disabled).toBe(true);
    expect(button("Cancel").disabled).toBe(false);
    tick(300);
    expect(screen.getByText("0 of 12 pages uploaded")).toBeTruthy();
    tick(3000);

    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByText("11 of 12 pages uploaded")).toBeTruthy();
    expect(announcer().textContent).toBe("11 of 12 pages uploaded. 1 failed.");
    const failed = document.querySelector('[data-status="error"]') as HTMLElement;
    expect(within(failed).getByText("The upload failed. Retry the page.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("1 page failed to upload");
    expect(button("Publish").disabled).toBe(true);

    fireEvent.click(button("Retry ch13-p07-error.png"));
    expect(announcer().textContent).toBe("Uploading ch13-p07-error.png");
    tick(1500);
    expect(screen.getByText("12 of 12 pages uploaded")).toBeTruthy();
    expect(document.querySelector('[data-status="error"]')).toBeNull();
    expect(button("Publish").disabled).toBe(false);

    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "The last stop" } });
    fireEvent.click(button("Publish"));
    expect(announcer().textContent).toBe("Chapter 13 published");
    expect(onPublish).toHaveBeenCalledWith(
      { seriesId: "night-train", chapter: 13, title: "The last stop" },
      expect.any(Array),
    );
  });

  it("Publish with an empty title focuses it and marks it invalid", () => {
    vi.useFakeTimers();
    const onPublish = vi.fn();
    render(<UploadForm series={uploadSeries} onPublish={onPublish} />);
    pick([fileOf("ch13-p01.png")]);
    fireEvent.click(button("Upload"));
    tick(1500);
    fireEvent.click(button("Publish"));
    const title = screen.getByLabelText(/Title/);
    expect(document.activeElement).toBe(title);
    expect(title.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Enter a chapter title.")).toBeTruthy();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it("Cancel stops the timer and puts the uploading pages back", () => {
    vi.useFakeTimers();
    render(<UploadForm series={uploadSeries} />);
    pick([fileOf("ch13-p01.png"), fileOf("ch13-p02.png")]);
    fireEvent.click(button("Upload"));
    tick(300);
    expect(vi.getTimerCount()).toBe(1);
    fireEvent.click(button("Cancel"));
    expect(vi.getTimerCount()).toBe(0);
    expect(announcer().textContent).toBe("Upload cancelled");
    tick(3000);
    expect(screen.getByText("0 of 2 pages uploaded")).toBeTruthy();
    expect(document.querySelectorAll('[data-status="idle"]')).toHaveLength(2);
    expect(button("Upload").disabled).toBe(false);
  });

  it("clears the timer on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(<UploadForm series={uploadSeries} />);
    pick([fileOf("ch13-p01.png")]);
    fireEvent.click(button("Upload"));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("lists rejected files with their reasons", () => {
    render(<UploadForm series={uploadSeries} />);
    pick([
      fileOf("script.pdf", "application/pdf"),
      fileOf("ch13-poster.png", "image/png", 12 * 1024 * 1024),
    ]);
    const rows = document.querySelectorAll('[data-status="error"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("not an accepted file type");
    expect(rows[1].textContent).toContain("larger than 10 MB");
  });

  it("refuses a 41st page", () => {
    render(<UploadForm series={uploadSeries} />);
    pick(Array.from({ length: 41 }, (_, index) => fileOf(`p${index + 1}.png`)));
    expect(document.querySelectorAll('[data-status="idle"]')).toHaveLength(40);
    expect(document.querySelector('[data-status="error"]')?.textContent).toContain(
      "more than 40 files",
    );
  });

  it("keyboard: Tab goes through the fields, the dropzone's button, each row, then the actions", () => {
    render(<UploadForm series={uploadSeries} />);
    pick([fileOf("ch13-p01.png")]);
    const tabbable = Array.from(
      screen.getByRole("form").querySelectorAll<HTMLElement>("button, input, [tabindex]"),
    )
      .filter((element) => element.tabIndex >= 0 && !(element as HTMLButtonElement).disabled)
      .filter((element) => element.getAttribute("type") !== "hidden")
      .map(
        (element) =>
          element.getAttribute("aria-label") ??
          element.getAttribute("name") ??
          element.textContent?.trim(),
      );
    expect(tabbable.at(0)).not.toBe("pages");
    expect(tabbable.slice(-3)).toEqual(["Choose pages", "Remove ch13-p01.png", "Upload"]);
  });
});

describe("validateChapter", () => {
  it("wants a chapter of 1 or more and a title", () => {
    expect(validateChapter(null, "")).toEqual({
      chapter: "Enter a chapter number of 1 or more.",
      title: "Enter a chapter title.",
    });
    expect(validateChapter(0, "x").chapter).toBeTruthy();
    expect(validateChapter(13, "  The last stop ")).toEqual({});
  });
});

describe("upload-01 variants", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
