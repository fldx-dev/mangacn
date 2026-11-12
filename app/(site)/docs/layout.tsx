import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { PaintWithPage } from "@/components/docs/page-end";
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
      // A head link, not a banner: React hoists it (see page-end.tsx for what it does). It
      // rides in the sidebar's banner slot because that slot exists and is empty, so the
      // layout's tree keeps its shape (a new sibling of `children` would change every `useId`
      // on the page, and the pen's outlines). Below 768 px Fumadocs unmounts this sidebar once
      // hydrated and the link goes with it; it has done its work by then, while the HTML was
      // parsed.
      sidebar={{ banner: <PaintWithPage /> }}
    >
      {children}
    </DocsLayout>
  );
}
