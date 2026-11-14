import { RootProvider } from "fumadocs-ui/provider/next";
import { ViewTransition } from "react";
import { SkipLink } from "@/components/docs/skip-link";

// Site chrome provider (theme via next-themes, search dialog). Only the (site) group gets it:
// the stage and gallery under app/demo keep their own `?mode=dark` switch (SPEC-docs-site §3.4).
// A navigation turns the page: the next one is laid over from the right (globals.css,
// `.page-turn`); under reduced motion it is a plain swap.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <RootProvider>
      <SkipLink />
      <ViewTransition default="page-turn">{children}</ViewTransition>
    </RootProvider>
  );
}
