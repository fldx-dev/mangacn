import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible } from "@/lib/test/axe";
import { CharacterCard } from "./character-card";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const portrait = { src: "/mio.png", alt: "Mio, short dark hair" };

describe("CharacterCard", () => {
  it("is an article named by the name, with the portrait in a 3:4 manga-frame", () => {
    render(<CharacterCard name="Mio Amano" portrait={portrait} className="mx-auto" />);
    const article = screen.getByRole("article", { name: "Mio Amano" });
    expect(article.dataset.slot).toBe("character-card");
    expect(article.classList.contains("mx-auto")).toBe(true);
    expect(article.querySelector('[data-slot="card"]')).toBeTruthy();
    const image = within(article).getByRole("img", { name: portrait.alt });
    expect(image.closest('[data-slot="manga-frame"]')?.getAttribute("data-aspect")).toBe("3/4");
    // Only what was passed: no role box, bubble, stats, stamp or link.
    for (const slot of ["caption-box", "speech-bubble", "character-card-stats", "stamp"]) {
      expect(article.querySelector(`[data-slot="${slot}"]`), slot).toBeNull();
    }
    expect(within(article).queryByRole("link")).toBeNull();
  });

  it("sets the reading as ruby over the name under lang=ja; the name alone names the article", () => {
    render(<CharacterCard name="天野 ミオ" reading="あまの みお" portrait={portrait} />);
    const article = screen.getByRole("article", { name: "天野 ミオ" });
    const ruby = article.querySelector("ruby");
    expect(ruby?.getAttribute("lang")).toBe("ja");
    expect(ruby?.querySelector("rt")?.textContent).toBe("あまの みお");
    // The parentheses show only where ruby is not supported.
    expect([...(ruby?.querySelectorAll("rp") ?? [])].map((rp) => rp.textContent)).toEqual([
      "(",
      ")",
    ]);
    expect(ruby?.firstChild?.textContent).toBe("天野 ミオ");
  });

  it("puts the cast role in a caption box, the quote in a speech bubble and the status on a stamp", () => {
    render(
      <CharacterCard
        name="Mio Amano"
        castRole="Lead · Lantern keeper"
        quote="The lanterns are lit."
        status="MAIN"
        portrait={portrait}
      />,
    );
    const article = screen.getByRole("article", { name: "Mio Amano" });
    expect(article.querySelector('[data-slot="caption-box"]')?.textContent).toBe(
      "Lead · Lantern keeper",
    );
    expect(article.querySelector('[data-slot="speech-bubble"]')?.textContent).toContain(
      "The lanterns are lit.",
    );
    const stamp = article.querySelector('[data-slot="stamp"]');
    expect(stamp?.textContent).toBe("MAIN");
    expect(stamp?.closest('[data-slot="character-card-portrait"]')).toBeTruthy();
    // castRole is the part they play; the card itself stays a plain article.
    expect(article.getAttribute("role")).toBeNull();
  });

  it("lists the stats as a description list with the values as text, the gauges hidden", () => {
    render(
      <CharacterCard
        name="Mio Amano"
        portrait={portrait}
        stats={[
          { label: "Courage", value: 80 },
          { label: "Luck", value: 3, max: 10 },
        ]}
      />,
    );
    const list = document.querySelector('[data-slot="character-card-stats"]') as HTMLElement;
    expect(list.tagName).toBe("DL");
    const terms = [...list.querySelectorAll("dt")].map((dt) => dt.textContent);
    const details = [...list.querySelectorAll("dd > span")].map((dd) => dd.textContent);
    expect(terms).toEqual(["Courage", "Luck"]);
    expect(details).toEqual(["80 of 100", "3 of 10"]);
    const gauges = list.querySelectorAll('[data-slot="power-gauge"]');
    expect(gauges).toHaveLength(2);
    for (const gauge of gauges) expect(gauge.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryAllByRole("meter")).toHaveLength(0);
  });

  it("makes the name one link covering the card when href is set", () => {
    render(<CharacterCard name="Mio Amano" reading="みお" portrait={portrait} href="/cast/mio" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Mio Amano" }).getAttribute("href")).toBe("/cast/mio");
    expect(links[0].className).toContain("after:inset-0");
    expect(links[0].querySelector("ruby")).toBeTruthy();
  });

  it("is a server component: no directive", () => {
    const source = readFileSync(
      path.resolve("registry/blocks/character-card/character-card.tsx"),
      "utf8",
    );
    expect(hasUseClientDirective(source)).toBe(false);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
