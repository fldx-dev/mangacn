import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible } from "@/lib/test/axe";
import { firstRowSize, VolumeGrid, volumeLabel } from "./volume-grid";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const volumes = Array.from({ length: 6 }, (_, i) => ({
  number: i + 1,
  title: `Title ${i + 1}`,
  cover: { src: `/covers/${i + 1}.png`, alt: `Cover ${i + 1}` },
  href: `/volumes/${i + 1}`,
  date: i === 0 ? "Jan 2026" : undefined,
  isNew: i === 5,
}));

const loading = () =>
  [...document.querySelectorAll<HTMLImageElement>("img")].map((image) =>
    image.getAttribute("loading"),
  );

describe("volumeLabel and firstRowSize", () => {
  it("writes Volume 3, or 第3巻", () => {
    expect(volumeLabel(3)).toBe("Volume 3");
    expect(volumeLabel(3, "ja")).toBe("第3巻");
  });

  it("takes the widest row's count", () => {
    expect(firstRowSize(3)).toBe(3);
    expect(firstRowSize({ base: 2, sm: 3, md: 4 })).toBe(4);
    expect(firstRowSize({ base: 1 })).toBe(1);
    expect(firstRowSize({})).toBe(1);
  });
});

describe("VolumeGrid", () => {
  it("is a named nav around a list, one item per volume", () => {
    render(<VolumeGrid volumes={volumes} label="Series volumes" className="mx-auto" />);
    const nav = screen.getByRole("navigation", { name: "Series volumes" });
    expect(nav.dataset.slot).toBe("volume-grid");
    expect(nav.classList.contains("mx-auto")).toBe(true);
    const list = within(nav).getByRole("list");
    expect(list.dataset.slot).toBe("panel-grid");
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);
  });

  it("names the nav Volumes by default", () => {
    render(<VolumeGrid volumes={volumes} />);
    expect(screen.getByRole("navigation", { name: "Volumes" })).toBeTruthy();
  });

  it("makes each cover one link named by the volume and title, the new one stamped", () => {
    render(<VolumeGrid volumes={volumes} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Volume 1 Title 1" }).getAttribute("href")).toBe(
      "/volumes/1",
    );
    const newest = screen.getByRole("link", { name: "Volume 6 Title 6 NEW" });
    expect(newest.querySelector('[data-slot="stamp"]')?.textContent).toBe("NEW");
    expect(document.querySelectorAll('[data-slot="stamp"]')).toHaveLength(1);
    // The cover, folio and text are all inside the one link; the date is printed as given.
    expect(links[0].querySelector('[data-slot="manga-frame"]')).toBeTruthy();
    expect(links[0].textContent).toContain("Jan 2026");
  });

  it("frames each cover at 2:3 through aspect-ratio, the folio hidden from assistive tech", () => {
    render(<VolumeGrid volumes={volumes.slice(0, 1)} />);
    const box = document.querySelector<HTMLElement>('[data-slot="aspect-ratio"]');
    expect(Number(box?.style.getPropertyValue("--ratio"))).toBeCloseTo(2 / 3);
    expect(box?.querySelector('[data-slot="manga-frame"] img')?.getAttribute("alt")).toBe(
      "Cover 1",
    );
    const folio = document.querySelector('[data-slot="page-number"]');
    expect(folio?.getAttribute("aria-hidden")).toBe("true");
    expect(folio?.textContent).toContain("1");
  });

  it("writes 第3巻 under lang=ja with the stamp in Japanese", () => {
    render(<VolumeGrid volumes={volumes} numerals="ja" />);
    expect(screen.getByRole("link", { name: "第3巻 Title 3" })).toBeTruthy();
    expect(screen.getByText("第3巻").getAttribute("lang")).toBe("ja");
    const stamp = document.querySelector('[data-slot="stamp"]');
    expect(stamp?.textContent).toBe("最新");
    expect(stamp?.getAttribute("lang")).toBe("ja");
    expect(screen.getByRole("link", { name: "第6巻 Title 6 最新" })).toBeTruthy();
  });

  it("loads the first row's covers at once and the rest lazily", () => {
    render(<VolumeGrid volumes={volumes} />);
    // The default columns reach four from md: four eager, then lazy.
    expect(loading()).toEqual([null, null, null, null, "lazy", "lazy"]);
    cleanup();
    render(<VolumeGrid volumes={volumes} columns={2} />);
    expect(loading()).toEqual([null, null, "lazy", "lazy", "lazy", "lazy"]);
  });

  it("is a server component: no directive", () => {
    const source = readFileSync(
      path.resolve("registry/blocks/volume-grid/volume-grid.tsx"),
      "utf8",
    );
    expect(hasUseClientDirective(source)).toBe(false);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
