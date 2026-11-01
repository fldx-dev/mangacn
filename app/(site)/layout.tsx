import { RootProvider } from "fumadocs-ui/provider/next";

// Site chrome provider (theme via next-themes, search dialog). Only the (site) group gets it:
// the stage and gallery under app/demo keep their own `?mode=dark` switch (SPEC-docs-site §3.4).
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <RootProvider>{children}</RootProvider>;
}
