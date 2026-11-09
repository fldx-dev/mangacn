import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

afterEach(cleanup);

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("Empty", () => {
  it("renders every part with its data-slot and a forwarded className", () => {
    render(
      <Empty className="empty-class">
        <EmptyHeader className="header-class">
          <EmptyMedia className="media-class" />
          <EmptyTitle className="title-class">No chapters yet</EmptyTitle>
          <EmptyDescription className="description-class">Start one.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="content-class">Actions</EmptyContent>
      </Empty>,
    );
    for (const [name, className] of [
      ["empty", "empty-class"],
      ["empty-header", "header-class"],
      ["empty-icon", "media-class"],
      ["empty-title", "title-class"],
      ["empty-description", "description-class"],
      ["empty-content", "content-class"],
    ]) {
      expect(slot(name)?.classList.contains(className), name).toBe(true);
    }
  });

  it("keeps stock's layout classes", () => {
    render(<Empty />);
    for (const name of ["flex-col", "items-center", "gap-4", "p-6", "text-center"]) {
      expect(slot("empty")?.classList.contains(name), name).toBe(true);
    }
  });

  it("sets the title in the display face and the description in the body face", () => {
    render(
      <>
        <EmptyTitle>No chapters yet</EmptyTitle>
        <EmptyDescription>Start one.</EmptyDescription>
      </>,
    );
    expect(slot("empty-title")?.classList.contains("font-display")).toBe(true);
    expect(slot("empty-title")?.classList.contains("font-heading")).toBe(false);
    expect(slot("empty-description")?.className).not.toMatch(/font-(display|dialogue)/);
  });

  it("draws a decorative sweat drop when the default media slot is empty", () => {
    render(<EmptyMedia />);
    const media = slot("empty-icon");
    expect(media?.dataset.variant).toBe("default");
    const mark = media?.querySelector<SVGElement>('[data-slot="emanata"]');
    expect(mark?.dataset.kind).toBe("sweat");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws a small sparkle in the icon tile", () => {
    render(<EmptyMedia variant="icon" />);
    const media = slot("empty-icon");
    expect(media?.dataset.variant).toBe("icon");
    for (const name of ["size-8", "rounded-lg", "bg-muted"]) {
      expect(media?.classList.contains(name), name).toBe(true);
    }
    const mark = media?.querySelector<SVGElement>('[data-slot="emanata"]');
    expect(mark?.dataset.kind).toBe("sparkle");
    expect(mark?.classList.contains("size-5")).toBe(true);
  });

  it("shows the caller's media instead of the default mark", () => {
    render(
      <EmptyMedia>
        <span data-testid="own">★</span>
      </EmptyMedia>,
    );
    expect(screen.getByTestId("own")).not.toBeNull();
    expect(slot("emanata")).toBeNull();
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
