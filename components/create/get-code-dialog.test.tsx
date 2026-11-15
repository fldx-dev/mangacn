import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { decode } from "@/lib/create/code";
import { createCommands } from "@/lib/create/commands";
import type { CreateConfig } from "@/lib/create/config";
import { agentPrompt } from "@/lib/create/describe";
import { stubGetAnimations } from "@/lib/test/animations";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { GetCodeDialog } from "./get-code-dialog";

const CODES = ["10", "1H11", "1J4blt1gX22"];

function config(code: string): CreateConfig {
  const result = decode(code);
  if (!result.ok) throw new Error(result.reason);
  return result.config;
}

async function open(code: string) {
  render(<GetCodeDialog code={code} config={config(code)} />);
  fireEvent.click(screen.getByRole("button", { name: "Get code" }));
  return screen.findByRole("dialog", { name: "Get code" });
}

const slot = (root: HTMLElement, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`)?.textContent;

/** Clicks a tab by name, as Base UI and Radix both select on a pointer press. */
function selectTab(root: HTMLElement, name: string) {
  const tab = within(root).getByRole("tab", { name });
  fireEvent.pointerDown(tab, { button: 0 });
  fireEvent.mouseDown(tab, { button: 0 });
  fireEvent.click(tab);
}

let restoreAnimations: () => void;
beforeAll(() => {
  restoreAnimations = stubGetAnimations();
});
afterAll(() => restoreAnimations());

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GetCodeDialog", () => {
  it.each(CODES)(
    "prints commands.ts's lines for code %s, character for character",
    async (code) => {
      const dialog = await open(code);
      const pnpm = createCommands(config(code), "pnpm");
      expect(slot(dialog, "create-dialog-code")).toBe(code);
      expect(slot(dialog, "create-command-new")).toBe(pnpm.nextProject);

      selectTab(dialog, "Existing project");
      await waitFor(() =>
        expect(slot(dialog, "create-command-existing")).toBe(pnpm.existingProject),
      );
      expect(slot(dialog, "create-command-look")).toBe(pnpm.lookOnly);
    },
  );

  it("switches to Vite and to another package manager, remembered with the item pages'", async () => {
    const code = "1H11";
    const dialog = await open(code);
    fireEvent.click(within(dialog).getByRole("button", { name: "Vite" }));
    await waitFor(() =>
      expect(slot(dialog, "create-command-new")).toBe(
        createCommands(config(code), "pnpm").viteProject,
      ),
    );
    expect(slot(dialog, "create-vite-note")).toContain("Fontsource");

    selectTab(dialog, "bun");
    await waitFor(() =>
      expect(slot(dialog, "create-command-new")).toBe(
        createCommands(config(code), "bun").viteProject,
      ),
    );
    expect(window.localStorage.getItem("package-manager")).toBe("bun");

    selectTab(dialog, "For an agent");
    await waitFor(() =>
      expect(slot(dialog, "create-agent-prompt")).toBe(
        agentPrompt(config(code), { manager: "bun", framework: "vite" }),
      ),
    );
    expect(within(dialog).getByRole("link", { name: "/create.md" }).getAttribute("href")).toBe(
      `/create.md?c=${code}`,
    );
  });

  it("starts on the package manager an item page remembered", async () => {
    window.localStorage.setItem("package-manager", "yarn");
    const dialog = await open("10");
    await waitFor(() =>
      expect(slot(dialog, "create-command-new")).toBe(
        createCommands(config("10"), "yarn").nextProject,
      ),
    );
  });

  it("lists the files the kit writes", async () => {
    const dialog = await open("10");
    selectTab(dialog, "What you get");
    const files = await waitFor(() => {
      const list = dialog.querySelector<HTMLElement>('[data-slot="create-files"]');
      if (!list) throw new Error("not loaded yet");
      return list;
    });
    for (const text of [
      "app/globals.css",
      "app/layout.tsx",
      "components/ui/button.tsx",
      "roughjs",
    ]) {
      expect(files.textContent).toContain(text);
    }
  });

  it("copies a command and says so to assistive tech", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const dialog = await open("1H11");
    const status = dialog.querySelector('[data-slot="create-copy-command-status"]');
    expect(status?.getAttribute("role")).toBe("status");
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Copy new Next.js project command" }),
      );
    });
    expect(writeText).toHaveBeenCalledWith(createCommands(config("1H11"), "pnpm").nextProject);
    expect(status?.textContent).toBe("New Next.js project command copied");
  });

  it("has no axe violations with the dialog open", async () => {
    await expectNoA11yViolations(<GetCodeDialog code="10" config={config("10")} />, async () => {
      fireEvent.click(screen.getByRole("button", { name: "Get code" }));
      await screen.findByRole("dialog", { name: "Get code" });
    });
  });
});
