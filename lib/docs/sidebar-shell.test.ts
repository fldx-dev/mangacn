import { describe, expect, it } from "vitest";
import { isSidebarShell, sidebarShells } from "./sidebar-shell";

describe("sidebarShells", () => {
  it("is the sidebar and the blocks that install it", () => {
    expect([...sidebarShells()].sort()).toEqual([
      "library-page",
      "sidebar",
      "sidebar-07",
      "sidebar-08",
      "sidebar-09",
      "sidebar-10",
      "sidebar-11",
      "sidebar-12",
      "sidebar-13",
      "sidebar-15",
      "sidebar-16",
    ]);
  });

  it("reads registryDependencies by mangacn URL, not by name", () => {
    const shells = sidebarShells({
      items: [
        { name: "a", type: "registry:block", registryDependencies: ["sidebar"], files: [] },
        {
          name: "b",
          type: "registry:block",
          registryDependencies: ["https://www.mangacn.com/r/sidebar.json"],
          files: [],
        },
      ],
    } as never);
    expect([...shells]).toEqual(["b"]);
  });
});

describe("isSidebarShell", () => {
  it("tells a sidebar shell from a page without one", () => {
    expect(isSidebarShell("sidebar-07")).toBe(true);
    expect(isSidebarShell("login-01")).toBe(false);
  });
});
