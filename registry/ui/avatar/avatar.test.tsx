import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "./avatar";
import AvatarDefaultDemo from "./demos/default";

afterEach(cleanup);

describe("Avatar", () => {
  it("renders every part with its data-slot, size and a forwarded className", () => {
    render(
      <AvatarGroup>
        <Avatar size="lg" className="custom-class">
          <AvatarFallback>MK</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <AvatarGroupCount>+2</AvatarGroupCount>
      </AvatarGroup>,
    );
    const fallback = screen.getByText("MK");
    expect(fallback.getAttribute("data-slot")).toBe("avatar-fallback");
    const avatar = fallback.closest<HTMLElement>('[data-slot="avatar"]');
    expect(avatar?.getAttribute("data-size")).toBe("lg");
    expect(avatar?.classList.contains("custom-class")).toBe(true);
    expect(avatar?.querySelector('[data-slot="avatar-badge"]')).not.toBeNull();
    expect(avatar?.parentElement?.getAttribute("data-slot")).toBe("avatar-group");
    expect(screen.getByText("+2").getAttribute("data-slot")).toBe("avatar-group-count");
  });

  it("inks an unfilled ellipse over the picture instead of the ::after border", () => {
    render(
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>,
    );
    const avatar = screen.getByText("MK").closest<HTMLElement>('[data-slot="avatar"]');
    for (const name of avatar?.classList ?? []) {
      expect(name, name).not.toMatch(/^after:border|mix-blend/);
    }
    const frame = avatar?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-shape")).toBe("ellipse");
    expect(frame?.getAttribute("data-fill")).toBe("none");
    // Above the image (z-1), below the badge (z-10).
    expect(frame?.className).toContain("z-1");
    expect(avatar?.lastElementChild).toBe(frame);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<AvatarDefaultDemo />);
  });
});
