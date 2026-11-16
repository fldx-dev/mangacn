import { RootProvider } from "fumadocs-ui/provider/next";
import { PageTurn } from "@/components/docs/page-turn";
import { SkipLink } from "@/components/docs/skip-link";

// Site chrome provider (theme via next-themes, search dialog). Only the (site) group gets it:
// the stage and gallery under app/demo keep their own `?mode=dark` switch (SPEC-docs-site §3.4).
// A navigation turns the page (components/docs/page-turn.tsx); under reduced motion it is a
// plain swap, with no view transition.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <RootProvider>
      <SkipLink />
      <PageTurn>{children}</PageTurn>
    </RootProvider>
  );
}
