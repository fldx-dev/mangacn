import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installCommand } from "@/lib/docs/install-command";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { InstallCommand } from "./install-command";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
});

const visibleCode = () => screen.getByRole("tabpanel").querySelector("pre")?.textContent;

describe("InstallCommand", () => {
  it("renders one tab per package manager with pnpm selected", () => {
    const { container } = render(<InstallCommand item="speech-bubble" />);
    expect(container.querySelector('[data-slot="install-command"]')).not.toBeNull();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "pnpm",
      "npm",
      "yarn",
      "bun",
    ]);
    expect(visibleCode()).toBe(installCommand("speech-bubble", "pnpm"));
  });

  it("switches the command with the tab and remembers the choice for the group", () => {
    render(<InstallCommand item="speech-bubble" />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "bun" }));
    expect(visibleCode()).toBe(installCommand("speech-bubble", "bun"));
    expect(localStorage.getItem("package-manager")).toBe("bun");
  });

  it("copies the visible command", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<InstallCommand item="button" />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "npm" }));
    const panel = screen.getByRole("tabpanel");
    await act(async () => {
      fireEvent.click(panel.querySelector("button") as HTMLButtonElement);
    });
    expect(writeText).toHaveBeenCalledWith(
      "npx shadcn@latest add @mangacn/ink-frame @mangacn/button",
    );
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(<InstallCommand item="theme" />);
  });
});
