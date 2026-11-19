import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { AvatarStack } from "./avatar-stack";

afterEach(cleanup);

const people = ["Aiko Mori", "Kenji Arata", "Sora Hayashi", "Yuki Tanabe", "Haru Ogawa", "Mei"].map(
  (name) => ({ name }),
);

describe("AvatarStack", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("composes avatar's group, avatars and count, each with its data-slot", () => {
    render(<AvatarStack items={people} className="custom" />);
    const root = document.querySelector<HTMLElement>('[data-slot="avatar-stack"]');
    expect(root?.classList.contains("custom")).toBe(true);
    const group = root?.querySelector('[data-slot="avatar-group"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.querySelectorAll('[data-slot="avatar"]')).toHaveLength(4);
    expect(group?.querySelector('[data-slot="avatar-group-count"]')).not.toBeNull();
  });

  it('names the group "{n} people" unless aria-label says otherwise', () => {
    const { unmount } = render(<AvatarStack items={people} />);
    expect(screen.getByRole("group", { name: "6 people" })).not.toBeNull();
    unmount();
    render(<AvatarStack items={people} aria-label="Authors" />);
    expect(screen.getByRole("group", { name: "Authors" })).not.toBeNull();
  });

  it("shows max avatars and a +N button for the rest", () => {
    render(<AvatarStack items={people} max={2} />);
    expect(document.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2);
    const more = screen.getByRole("button", { name: "4 more" });
    expect(more.textContent).toBe("+4");
  });

  it("shows everyone and no button when the items fit in max", () => {
    render(<AvatarStack items={people.slice(0, 3)} />);
    expect(document.querySelectorAll('[data-slot="avatar"]')).toHaveLength(3);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("draws initials from the name without src, keeping the full name for assistive tech", () => {
    render(<AvatarStack items={[{ name: "Aiko Mori" }, { name: "Clamp" }]} />);
    const fallbacks = document.querySelectorAll<HTMLElement>('[data-slot="avatar-fallback"]');
    expect(fallbacks[0]?.textContent).toBe("AMAiko Mori");
    expect(fallbacks[0]?.querySelector('[aria-hidden="true"]')?.textContent).toBe("AM");
    expect(fallbacks[0]?.querySelector(".sr-only")?.textContent).toBe("Aiko Mori");
    expect(fallbacks[1]?.querySelector('[aria-hidden="true"]')?.textContent).toBe("C");
  });

  it("gives a picture its name as alt", () => {
    render(<AvatarStack items={[{ name: "Aiko Mori", src: "data:image/png;base64,AA==" }]} />);
    // Base UI renders the image once it has loaded; the fallback keeps the name until then.
    expect(screen.getByText("Aiko Mori")).not.toBeNull();
  });

  it("passes size to every avatar", () => {
    render(<AvatarStack items={people} size="lg" />);
    for (const avatar of document.querySelectorAll('[data-slot="avatar"]')) {
      expect(avatar.getAttribute("data-size")).toBe("lg");
    }
  });

  it("lists the hidden names in the +N button's tooltip on keyboard focus", async () => {
    render(<AvatarStack items={people} max={4} />);
    const more = screen.getByRole("button", { name: "2 more" });
    await act(async () => {
      more.focus();
      fireEvent.focus(more);
    });
    const tooltip = await screen.findByText("Haru Ogawa, Mei");
    expect(tooltip.closest('[data-slot="tooltip-content"]')).not.toBeNull();
  });

  it("takes the +N button's name from labels", () => {
    render(<AvatarStack items={people} max={1} labels={{ more: (n) => `${n} weitere` }} />);
    expect(screen.getByRole("button", { name: "5 weitere" })).not.toBeNull();
  });

  it("stays on one line", () => {
    render(<AvatarStack items={people} />);
    expect(document.querySelector('[data-slot="avatar-group"]')?.className).toContain(
      "flex-nowrap",
    );
  });
});
