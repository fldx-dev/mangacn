import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import PanelGridDefaultDemo from "./demos/default";
import { PanelGrid, PanelGridItem } from "./panel-grid";

afterEach(cleanup);

const gridOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe("PanelGrid", () => {
  it("renders a div grid with data-slot and a forwarded className", () => {
    const grid = gridOf(render(<PanelGrid className="custom-class" />).container);
    expect(grid.tagName).toBe("DIV");
    expect(grid.dataset.slot).toBe("panel-grid");
    expect(grid.classList.contains("grid")).toBe(true);
    expect(grid.classList.contains("custom-class")).toBe(true);
  });

  it("collapses to one column below sm", () => {
    const grid = gridOf(render(<PanelGrid columns={3} />).container);
    expect(grid.classList.contains("grid-cols-1")).toBe(true);
    expect(grid.classList.contains("sm:grid-cols-3")).toBe(true);
    expect(grid.classList.contains("grid-cols-3")).toBe(false);
  });

  it("accepts columns per breakpoint", () => {
    const grid = gridOf(render(<PanelGrid columns={{ sm: 2, lg: 4 }} />).container);
    for (const name of ["grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-4"]) {
      expect(grid.classList.contains(name), name).toBe(true);
    }
  });

  it.each([
    ["sm", "gap-2"],
    ["md", "gap-4"],
    ["lg", "gap-6"],
  ] as const)("maps gutter %s to %s", (gutter, name) => {
    const grid = gridOf(render(<PanelGrid gutter={gutter} />).container);
    expect(grid.dataset.gutter).toBe(gutter);
    expect(grid.classList.contains(name)).toBe(true);
  });

  it("spans items from sm up", () => {
    const { container } = render(
      <PanelGridItem colSpan={2} rowSpan={3} className="custom-class" />,
    );
    const item = container.firstElementChild as HTMLElement;
    expect(item.dataset.slot).toBe("panel-grid-item");
    expect(item.dataset.colSpan).toBe("2");
    expect(item.dataset.rowSpan).toBe("3");
    for (const name of ["sm:col-span-2", "sm:row-span-3", "custom-class", "min-w-0"]) {
      expect(item.classList.contains(name), name).toBe(true);
    }
  });

  it("spans a full row at every width", () => {
    const item = render(<PanelGridItem colSpan="full" />).container.firstElementChild;
    expect(item?.classList.contains("col-span-full")).toBe(true);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<PanelGridDefaultDemo />);
  });
});
