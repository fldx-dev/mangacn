"use client";

import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import {
  TOC,
  TOCPopover,
  type TOCPopoverProps,
  TOCProvider,
} from "fumadocs-ui/layouts/docs/page/slots/toc";

const LABEL = "On this page";

// The narrow-screen table of contents is a <header> in a plain div, which reads as a second
// banner next to the docs nav; inside a <nav> it is navigation. `contents` keeps its grid slot;
// from `xl` the popover is hidden for the side TOC, and so is its landmark.
function TOCPopoverNav(props: TOCPopoverProps) {
  return (
    <nav aria-label={LABEL} className="contents xl:hidden">
      <TOCPopover {...props} />
    </nav>
  );
}

const toc = { provider: TOCProvider, main: TOC, popover: TOCPopoverNav };

/** Fumadocs' DocsPage with both tables of contents as named navigation landmarks. */
export function SiteDocsPage(props: DocsPageProps) {
  return (
    <DocsPage
      {...props}
      slots={{ toc }}
      // The wide-screen one is a plain div too; as navigation its links sit in a landmark.
      tableOfContent={{ container: { role: "navigation", "aria-label": LABEL } }}
    />
  );
}
