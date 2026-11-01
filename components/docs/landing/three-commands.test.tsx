import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installCommand } from "@/lib/docs/install-command";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ThreeCommands } from "./three-commands";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThreeCommands", () => {
  it("numbers three panels and prints each command from installCommand()", () => {
    const { container } = render(<ThreeCommands />);
    const captions = [...container.querySelectorAll('[data-slot="panel-caption"]')];
    expect(captions.map((caption) => caption.textContent)).toEqual(["1", "2", "3"]);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Theme and fonts",
      "The pen",
      "Any item",
    ]);
    expect([...container.querySelectorAll("pre")].map((pre) => pre.textContent)).toEqual([
      installCommand("theme", "pnpm"),
      installCommand("ink-frame", "pnpm"),
      installCommand("sfx-text", "pnpm"),
    ]);
  });

  it("gives every command a copy button", () => {
    const { container } = render(<ThreeCommands />);
    expect(container.querySelectorAll("figure button")).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(<ThreeCommands />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
