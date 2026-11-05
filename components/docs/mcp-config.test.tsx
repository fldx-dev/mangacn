import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { agentsSnippet, MCP_CLIENTS, MCP_URL } from "@/lib/docs/agents";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { AgentsSnippet } from "./agents-snippet";
import { McpConfig } from "./mcp-config";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
});

const panel = () => screen.getByRole("tabpanel");
const visibleCode = () => [...panel().querySelectorAll("pre")].map((pre) => pre.textContent);

async function copyFirst(scope: HTMLElement) {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
  await act(async () => {
    fireEvent.click(scope.querySelector("button") as HTMLButtonElement);
  });
  return writeText;
}

describe("McpConfig", () => {
  it("renders one tab per client with Claude Code's command and .mcp.json first", () => {
    const { container } = render(<McpConfig />);
    expect(container.querySelector('[data-slot="mcp-config"]')).not.toBeNull();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Claude Code",
      "Cursor",
      "VS Code",
      "Codex",
    ]);
    expect(visibleCode()).toEqual([
      `claude mcp add --transport http mangacn ${MCP_URL}`,
      JSON.stringify({ mcpServers: { mangacn: { type: "http", url: MCP_URL } } }, null, 2),
    ]);
    expect(panel().textContent).toContain(".mcp.json");
  });

  it("shows each client's file and shape", () => {
    render(<McpConfig />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Cursor" }));
    expect(panel().textContent).toContain(".cursor/mcp.json");
    expect(JSON.parse(visibleCode()[0] ?? "")).toEqual({
      mcpServers: { mangacn: { url: MCP_URL } },
    });

    fireEvent.mouseDown(screen.getByRole("tab", { name: "VS Code" }));
    expect(JSON.parse(visibleCode()[0] ?? "")).toEqual({
      servers: { mangacn: { type: "http", url: MCP_URL } },
    });

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Codex" }));
    expect(panel().textContent).toContain("~/.codex/config.toml");
    expect(visibleCode()).toEqual([`[mcp_servers.mangacn]\nurl = "${MCP_URL}"`]);
  });

  it("remembers the client for the group", () => {
    render(<McpConfig />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "VS Code" }));
    expect(localStorage.getItem("mcp-client")).toBe("vscode");
  });

  it("copies the exact config text", async () => {
    render(<McpConfig />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Codex" }));
    const writeText = await copyFirst(panel());
    expect(writeText).toHaveBeenCalledWith(MCP_CLIENTS[3].blocks[0].code);
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(<McpConfig />);
  });
});

describe("AgentsSnippet", () => {
  it("renders the skill's AGENTS.md block and copies it", async () => {
    const { container } = render(<AgentsSnippet />);
    const snippet = agentsSnippet();
    expect(snippet.split("\n")).toHaveLength(11);
    expect(snippet).toMatch(/^## UI: mangacn/);
    expect(container.querySelector("pre")?.textContent).toBe(snippet);
    const writeText = await copyFirst(container);
    expect(writeText).toHaveBeenCalledWith(snippet);
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(<AgentsSnippet />);
  });
});
