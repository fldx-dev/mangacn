import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { ThemePresetRoot } from "@/components/docs/theme-preset-root";
import { baseOptions } from "@/lib/docs/layout.shared";
import { source } from "@/lib/docs/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  const options = baseOptions();
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...options}
      // The header's empty `nav.children` slot carries the theme preset's no-flash script.
      nav={{ ...options.nav, children: <ThemePresetRoot /> }}
    >
      {children}
    </DocsLayout>
  );
}
