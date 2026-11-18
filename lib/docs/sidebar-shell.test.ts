import { describe, expect, it } from "vitest";
import { isSidebarShell, sidebarShells } from "./sidebar-shell";

describe("sidebarShells", () => {
  it("is the sidebar and the blocks that install it", () => {
    expect([...sidebarShells()].sort()).toEqual([
      "library-page",
      "sidebar",
      "sidebar-01",
      "sidebar-02",
      "sidebar-03",
      "sidebar-04",
      "sidebar-05",
      "sidebar-06",
      "sidebar-07",
      "sidebar-14",
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
