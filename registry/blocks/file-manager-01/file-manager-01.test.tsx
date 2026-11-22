import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import { FileManager, fileKind, formatFileSize, renameProblem } from "./components/file-manager";
import {
  fileManagerFiles,
  fileManagerFolders,
  fileManagerStartFolder,
} from "./components/file-manager-data";
import Page from "./page";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");
const announcer = () => screen.getAllByRole("status").at(-1) as HTMLElement;
const listHeading = () => screen.getByRole("heading", { level: 2, name: /Chapter|Volume|Covers/ });
const crumbs = () =>
  within(screen.getByRole("navigation", { name: /breadcrumb/i }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);
/** The text an input's aria-describedby points at. */
const reason = (input: HTMLElement) =>
  document.getElementById(input.getAttribute("aria-describedby") ?? "")?.textContent;
const rows = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.querySelector("td")?.textContent ?? "");

function renderManager(onFilesChange = vi.fn()) {
  render(
    <FileManager
      folders={fileManagerFolders}
      defaultFiles={fileManagerFiles}
      defaultFolder={fileManagerStartFolder}
      onFilesChange={onFilesChange}
    />,
  );
  return onFilesChange;
}

async function openMenu(name: string) {
  const trigger = screen.getByRole("button", { name: `Actions for ${name}` });
  fireEvent.click(trigger);
  const menu = await screen.findByRole("menu");
  return { trigger, menu };
}

function folderCount(folders = fileManagerFolders): number {
  return folders.reduce((sum, folder) => sum + 1 + folderCount(folder.children ?? []), 0);
}

describe("file-manager-01 data", () => {
  it("has 20 folders and 40 files, every file in a folder", () => {
    expect(folderCount()).toBe(20);
    expect(fileManagerFiles).toHaveLength(40);
    const ids = new Set<string>();
    const walk = (folders = fileManagerFolders) => {
      for (const folder of folders) {
        ids.add(folder.id);
        walk(folder.children ?? []);
      }
    };
    walk();
    for (const file of fileManagerFiles) expect(ids.has(file.folderId), file.id).toBe(true);
    expect(new Set(fileManagerFiles.map((file) => file.id)).size).toBe(40);
  });
});

describe("file-manager-01 page", () => {
  it("is one main with one h1, the open folder's breadcrumb and its files", () => {
    render(<Page />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Files",
    ]);
    expect(crumbs()).toEqual(["The Night Train Diaries", "Volume 1", "Chapter 1"]);
    expect(screen.getByRole("region", { name: "Chapter 1" })).toBeTruthy();
    expect(rows()).toHaveLength(6);
    expect(rows()[0]).toContain("night-train-ch01-p01.png");
    expect(screen.getByRole("tree", { name: "Folders" })).toBeTruthy();
  });

  it("folds the tree into a closed Folders collapsible for phones", () => {
    render(<Page />);
    const toggle = screen.getByRole("button", { name: "Folders" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("is a server page around a client file manager, importing it by install path once added", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/file-manager.tsx"))).toBe(true);
    expect(source("page.tsx")).toContain('from "./components/file-manager"');
    const installed = installedPageSource("file-manager-01");
    expect(installed).toContain('from "@/components/file-manager"');
    expect(installed).toContain('from "@/components/file-manager-data"');
  });

  it("reads no clock while rendering: the same markup at two dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 9));
    const first = renderToStaticMarkup(<Page />);
    vi.setSystemTime(new Date(2031, 6, 15, 23));
    expect(renderToStaticMarkup(<Page />)).toBe(first);
    for (const file of [
      "page.tsx",
      "components/file-manager.tsx",
      "components/file-manager-data.ts",
    ]) {
      expect(source(file), file).not.toMatch(/new Date\(\)|Date\.now|Math\.random|randomUUID/);
    }
  });

  it("draws nothing of its own", () => {
    for (const file of ["page.tsx", "components/file-manager.tsx"]) {
      expect(source(file), file).not.toMatch(/<svg|<img|shadow-|border-|text-spot|bg-spot/);
    }
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("FileManager: folders", () => {
  it("opens a folder from the tree by keyboard; the breadcrumb follows", () => {
    renderManager();
    const tree = screen.getByRole("tree", { name: "Folders" });
    const current = within(tree).getByRole("treeitem", { name: "Chapter 1", selected: true });
    expect(current.tabIndex).toBe(0);
    current.focus();
    fireEvent.keyDown(current, { key: "ArrowDown" });
    const next = within(tree).getByRole("treeitem", { name: "Chapter 2" });
    expect(document.activeElement).toBe(next);
    fireEvent.keyDown(next, { key: "Enter" });
    expect(crumbs()).toEqual(["The Night Train Diaries", "Volume 1", "Chapter 2"]);
    expect(rows()).toHaveLength(3);
    expect(announcer().textContent).toBe("Chapter 2 opened, 3 items");
  });

  it("opens a folder from a crumb, listing its subfolders, which open too", () => {
    renderManager();
    fireEvent.click(screen.getByRole("button", { name: "Volume 1" }));
    expect(crumbs()).toEqual(["The Night Train Diaries", "Volume 1"]);
    expect(rows()).toEqual(["Chapter 1Folder", "Chapter 2Folder", "Chapter 3Folder"]);
    fireEvent.click(within(screen.getByRole("table")).getByRole("button", { name: "Chapter 3" }));
    expect(crumbs().at(-1)).toBe("Chapter 3");
  });

  it("shows the empty state for an empty folder", () => {
    render(
      <FileManager
        folders={fileManagerFolders}
        defaultFiles={fileManagerFiles}
        defaultFolder="pm/v2/c3"
      />,
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("This folder is empty")).toBeTruthy();
  });
});

describe("FileManager: rename", () => {
  it("Enter commits, announces and returns focus to the row's action button", async () => {
    const onFilesChange = renderManager();
    const { trigger, menu } = await openMenu("night-train-ch01-p01.png");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Rename" }));
    const input = await screen.findByRole("textbox", {
      name: "New name for night-train-ch01-p01.png",
    });
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(input.getAttribute("name")).toBe("name");
    fireEvent.change(input, { target: { value: "title-page.png" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(rows()[0]).toContain("title-page.png");
    expect(announcer().textContent).toBe("night-train-ch01-p01.png renamed to title-page.png");
    expect(onFilesChange).toHaveBeenCalled();
    const renamed = screen.getByRole("button", { name: "Actions for title-page.png" });
    expect(renamed).toBe(trigger);
    expect(document.activeElement).toBe(trigger);
  });

  it("refuses an empty or duplicate name with a reason; Esc cancels", async () => {
    renderManager();
    const { trigger, menu } = await openMenu("night-train-ch01-p02.png");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Rename" }));
    const input = await screen.findByRole("textbox", { name: /New name for/ });

    fireEvent.change(input, { target: { value: "night-train-ch01-p03.png" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(reason(input)).toBe("night-train-ch01-p03.png is already in this folder.");
    expect(announcer().textContent).toBe("night-train-ch01-p03.png is already in this folder.");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(reason(input)).toBe("Enter a name.");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("textbox", { name: /New name for/ })).toBeNull();
    expect(rows()[1]).toContain("night-train-ch01-p02.png");
    expect(document.activeElement).toBe(trigger);
  });
});

describe("FileManager: delete, download, upload", () => {
  it("Delete asks first; confirming removes the row and lands focus on the list heading", async () => {
    renderManager();
    const { menu } = await openMenu("night-train-ch01-p06.png");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Delete" }));
    await act(async () => {});
    const dialog = screen.getByRole("alertdialog", { name: "Delete night-train-ch01-p06.png?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(rows()).toHaveLength(5);
    expect(announcer().textContent).toBe("night-train-ch01-p06.png deleted");
    await waitFor(() => expect(document.activeElement).toBe(listHeading()));
  });

  it("Cancel keeps the file and returns focus to the row's action button", async () => {
    renderManager();
    const { trigger, menu } = await openMenu("night-train-ch01-p06.png");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Delete" }));
    await act(async () => {});
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(rows()).toHaveLength(6);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("Download announces and changes nothing", async () => {
    const onFilesChange = renderManager();
    const { menu } = await openMenu("night-train-ch01-p01.png");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Download" }));
    expect(announcer().textContent).toBe("Downloading night-train-ch01-p01.png");
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it("an uploaded file joins the open folder with its size", () => {
    renderManager();
    const file = new File(["x"], "night-train-ch01-p07.png", {
      type: "image/png",
      lastModified: 0,
    });
    Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.name).toBe("files");
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    fireEvent.change(input);
    expect(rows()).toHaveLength(7);
    const row = within(screen.getByRole("table")).getAllByRole("row").at(-1) as HTMLElement;
    expect(row.textContent).toContain("night-train-ch01-p07.png");
    expect(row.textContent).toContain("2 MB");
    expect(announcer().textContent).toBe("1 file added to Chapter 1.");
  });

  it("refuses an upload whose name is already in the folder, any case, and says so", () => {
    const onFilesChange = renderManager();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pick = (names: string[]) => {
      const files = names.map((name) => new File(["x"], name, { type: "image/png" }));
      Object.defineProperty(input, "files", { configurable: true, value: files });
      fireEvent.change(input);
    };

    pick(["NIGHT-TRAIN-CH01-P01.png"]);
    expect(rows()).toHaveLength(6);
    expect(onFilesChange).not.toHaveBeenCalled();
    expect(announcer().textContent).toBe("NIGHT-TRAIN-CH01-P01.png is already in this folder.");

    pick(["extra.png", "Extra.png", "night-train-ch01-p02.png"]);
    expect(rows()).toHaveLength(7);
    expect(rows().filter((text) => /extra\.png/i.test(text))).toHaveLength(1);
    expect(announcer().textContent).toBe(
      "1 file added to Chapter 1. Extra.png is already in this folder. night-train-ch01-p02.png is already in this folder.",
    );
  });
});

describe("helpers", () => {
  it("renameProblem refuses empty, slashes and a sibling's name, any case", () => {
    expect(renameProblem("", "a.png", [])).toBe("Enter a name.");
    expect(renameProblem("a/b.png", "a.png", [])).toBeTruthy();
    expect(renameProblem("B.PNG", "a.png", ["b.png"])).toBe("B.PNG is already in this folder.");
    expect(renameProblem("A.PNG", "a.png", ["b.png"])).toBe("");
  });

  it("formats sizes and kinds in en-US", () => {
    expect(formatFileSize(512)).toBe("512 bytes");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
    expect(fileKind("p01.PNG").label).toBe("Image");
    expect(fileKind("pitch.pdf").label).toBe("Document");
    expect(fileKind("refs.zip").label).toBe("Archive");
    expect(fileKind("layout.psd").label).toBe("Artwork");
    expect(fileKind("notes").label).toBe("File");
  });
});

describe("file-manager-01 variants", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
