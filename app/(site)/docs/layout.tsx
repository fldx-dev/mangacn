import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { CloseDrawerOnHash } from "@/components/docs/close-drawer-on-hash";
import { ThemePresetRoot } from "@/components/docs/theme-preset-root";
import { baseOptions } from "@/lib/docs/layout.shared";
import { withVariants } from "@/lib/docs/sidebar-tree";
import { source } from "@/lib/docs/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  const options = baseOptions();
  return (
    <DocsLayout
      // Each component page is a folder of its variants' anchors (lib/docs/sidebar-tree.tsx).
      tree={withVariants(source.getPageTree())}
      {...options}
      // The header's empty `nav.children` slot carries the theme preset's no-flash script.
      nav={{ ...options.nav, children: <ThemePresetRoot /> }}
      // The sidebar's banner slot, in the desktop sidebar and the phone drawer alike, carries
      // the listener that closes the drawer on a variant link (a same-page hash link).
      sidebar={{ banner: <CloseDrawerOnHash /> }}
    >
      {children}
    </DocsLayout>
  );
}
