"use client";

import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import {
  TOC,
  TOCPopover,
  type TOCPopoverProps,
  TOCProvider,
} from "fumadocs-ui/layouts/docs/page/slots/toc";
import { PageEnd } from "./page-end";

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
  // The end marker (page-end.tsx) is the last element of the page body: after the side TOC
  // where Fumadocs renders one (a page that is not `full` and has headings), else after the
  // article's footer. Both are slots Fumadocs already has, empty until now, so no element of
  // the page gets a new sibling and every `useId` in a demo stays what it was.
  const sideToc = !props.full && (props.toc?.length ?? 0) > 0;
  return (
    <DocsPage
      {...props}
      slots={{ toc }}
      // The wide-screen one is a plain div too; as navigation its links sit in a landmark.
      tableOfContent={{
        container: { role: "navigation", "aria-label": LABEL },
        footer: sideToc ? <PageEnd /> : undefined,
      }}
      footer={{ children: sideToc ? undefined : <PageEnd /> }}
    />
  );
}
