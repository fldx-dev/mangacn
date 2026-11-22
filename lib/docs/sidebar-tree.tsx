import type * as PageTree from "fumadocs-core/page-tree";
import { componentVariants } from "./variant-meta";

const COMPONENT_URL = /^\/docs\/components\/([a-z0-9-]+)$/;

/**
 * The docs tree with each component page turned into a folder of its variants, as reui lists
 * them (SPEC-components-10 §5.2): the folder's link is the page, its name carries the variant
 * count, and its children link to the cards' `#c-<component>-<n>` anchors by label. Fumadocs
 * opens only the folder of the current page; the others open on click.
 */
export function withVariants(root: PageTree.Root): PageTree.Root {
  return { ...root, children: root.children.map(withVariantsNode) };
}

function withVariantsNode(node: PageTree.Node): PageTree.Node {
  if (node.type === "folder") {
    return { ...node, children: node.children.map(withVariantsNode) };
  }
  if (node.type !== "page") return node;
  const component = COMPONENT_URL.exec(node.url)?.[1];
  const variants = component ? componentVariants(component) : [];
  if (variants.length === 0) return node;
  return {
    type: "folder",
    $id: `${node.$id ?? node.url}:variants`,
    name: (
      <span
        data-slot="sidebar-variant-count"
        className="flex min-w-0 flex-1 items-center justify-between gap-2"
      >
        <span className="truncate">{node.name}</span>
        <span className="text-xs text-fd-muted-foreground tabular-nums">
          {variants.length}
          <span className="sr-only">{variants.length === 1 ? " variant" : " variants"}</span>
        </span>
      </span>
    ),
    index: node,
    children: variants.map((variant) => ({
      type: "page",
      $id: `${node.$id ?? node.url}#${variant.name}`,
      name: variant.label,
      url: `${node.url}#${variant.name}`,
    })),
  };
}
