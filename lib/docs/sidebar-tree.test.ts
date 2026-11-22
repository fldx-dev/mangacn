import type * as PageTree from "fumadocs-core/page-tree";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { withVariants } from "./sidebar-tree";
import { componentVariants } from "./variant-meta";

const page = (name: string, url: string): PageTree.Item => ({ type: "page", name, url });

const root: PageTree.Root = {
  name: "Docs",
  children: [
    page("Introduction", "/docs"),
    {
      type: "folder",
      name: "Components",
      index: page("Components", "/docs/components"),
      children: [
        { type: "separator", name: "Decoration" },
        page("Stamp", "/docs/components/stamp"),
        page("Unknown", "/docs/components/not-an-item"),
      ],
    },
    {
      type: "folder",
      name: "Blocks",
      children: [page("Chapter List", "/docs/blocks/chapter-list")],
    },
  ],
};

describe("withVariants", () => {
  const tree = withVariants(root);
  const components = tree.children[1] as PageTree.Folder;

  it("turns a component page into a folder of its variants' anchors, by label", () => {
    const stamp = components.children[1] as PageTree.Folder;
    expect(stamp.type).toBe("folder");
    expect(stamp.index).toEqual(page("Stamp", "/docs/components/stamp"));
    expect(stamp.defaultOpen).toBeUndefined();
    expect(stamp.children).toEqual(
      componentVariants("stamp").map((variant) => ({
        type: "page",
        $id: `/docs/components/stamp#${variant.name}`,
        name: variant.label,
        url: `/docs/components/stamp#${variant.name}`,
      })),
    );
    expect(stamp.children[2]).toMatchObject({ url: "/docs/components/stamp#c-stamp-3" });
  });

  it("names the folder with the page title and its variant count", () => {
    const stamp = components.children[1] as PageTree.Folder;
    const html = renderToStaticMarkup(createElement(Fragment, null, stamp.name));
    expect(html).toContain(">Stamp<");
    expect(html).toContain(">6<");
  });

  it("leaves everything else as it was", () => {
    expect(tree.children[0]).toEqual(root.children[0]);
    expect(components.children[0]).toEqual({ type: "separator", name: "Decoration" });
    expect(components.children[2]).toEqual(page("Unknown", "/docs/components/not-an-item"));
    expect(tree.children[2]).toEqual(root.children[2]);
  });
});
