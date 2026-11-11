import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

afterEach(cleanup);

function Site({ open }: { open?: boolean }) {
  return (
    <NavigationMenu defaultValue={open ? "series" : undefined} className="custom-root">
      <NavigationMenuList>
        <NavigationMenuItem value="series">
          <NavigationMenuTrigger className="custom-trigger">Series</NavigationMenuTrigger>
          <NavigationMenuContent className="custom-content">
            <ul>
              <li>
                <NavigationMenuLink href="#ongoing">Ongoing</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#completed">Completed</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="genres">
          <NavigationMenuTrigger>Genres</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#shonen">Shōnen</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#library" className={navigationMenuTriggerStyle()}>
            Library
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("NavigationMenu", () => {
  it("renders stock slots, with display-face triggers that ink while open", () => {
    render(<Site />);
    const root = document.querySelector('[data-slot="navigation-menu"]');
    expect(root?.classList.contains("custom-root")).toBe(true);
    expect(document.querySelector('[data-slot="navigation-menu-list"]')).toBeTruthy();
    expect(document.querySelectorAll('[data-slot="navigation-menu-item"]')).toHaveLength(3);
    const trigger = screen.getByRole("button", { name: "Series" });
    expect(trigger.getAttribute("data-slot")).toBe("navigation-menu-trigger");
    expect(trigger.classList.contains("custom-trigger")).toBe(true);
    expect(trigger.className).toContain("font-display");
    expect(trigger.className).toContain("data-popup-open:bg-primary");
    expect(trigger.className).toContain("data-popup-open:text-primary-foreground");
    expect(trigger.className).not.toContain("data-popup-open:bg-muted/50");
    // A plain link drawn as a trigger takes the same style.
    const library = screen.getByRole("link", { name: "Library" });
    expect(library.getAttribute("data-slot")).toBe("navigation-menu-link");
    expect(library.className).toContain("font-display");
  });

  it("opens dropdown-menu's heavy paper from the positioner, with no shadow or ring", async () => {
    render(<Site open />);
    await act(async () => {});
    const trigger = screen.getByRole("button", { name: "Series" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.hasAttribute("data-popup-open")).toBe(true);
    const content = document.querySelector<HTMLElement>('[data-slot="navigation-menu-content"]');
    expect(content?.classList.contains("custom-content")).toBe(true);
    const popup = content?.closest<HTMLElement>(".origin-\\(--transform-origin\\)");
    expect(popup).toBeTruthy();
    const positioner = popup?.parentElement;
    for (const element of [popup, content]) {
      for (const name of element?.classList ?? []) {
        expect(name, name).not.toMatch(/(^|:)shadow(-|$)|(^|:)ring-(1|foreground)|^bg-popover$/);
      }
    }
    expect(popup?.classList.contains("bg-transparent")).toBe(true);
    const frame = frameOf(positioner);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    const link = screen.getByRole("link", { name: "Ongoing" });
    expect(link.className).toContain("in-data-[slot=navigation-menu-content]:focus:bg-primary");
    expect(link.className).toContain(
      "in-data-[slot=navigation-menu-content]:focus:text-primary-foreground",
    );
  });

  it("draws the indicator as a small ink triangle with no shadow", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              Series
              <NavigationMenuIndicator />
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    const indicator = document.querySelector('[data-slot="navigation-menu-indicator"]');
    const triangle = indicator?.querySelector("svg");
    expect(triangle?.classList.contains("fill-foreground")).toBe(true);
    expect(indicator?.innerHTML).not.toContain("shadow");
  });

  it("opens with the keyboard, moves along the triggers and closes with Escape, like stock", async () => {
    render(<Site />);
    const series = screen.getByRole("button", { name: "Series" });
    const genres = screen.getByRole("button", { name: "Genres" });
    act(() => series.focus());
    fireEvent.keyDown(series, { key: "ArrowRight" });
    await act(async () => {});
    expect(document.activeElement).toBe(genres);
    fireEvent.click(genres);
    await act(async () => {});
    expect(genres.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Shōnen" })).toBeTruthy();
    fireEvent.keyDown(genres, { key: "Escape" });
    await act(async () => {});
    expect(genres.getAttribute("aria-expanded")).toBe("false");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
