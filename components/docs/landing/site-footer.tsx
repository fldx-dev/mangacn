import Link from "next/link";
import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { Panel } from "@/registry/ui/panel/panel";
import { Stamp } from "@/registry/ui/stamp/stamp";
import { ButtonLink } from "./button-link";

const GITHUB = "https://github.com/fldx-dev/mangacn";

const COLUMNS = [
  {
    title: "Docs",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "Theming", href: "/docs/theming" },
      { label: "Agents", href: "/docs/agents" },
    ],
  },
  {
    title: "Components",
    links: [
      { label: "All components", href: "/docs/components" },
      { label: "Primitives", href: "/docs/components#category-primitive" },
      { label: "Gallery", href: "/demo" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "GitHub", href: GITHUB },
      { label: "Issues", href: `${GITHUB}/issues` },
      { label: "MIT licence", href: `${GITHUB}/blob/main/LICENSE` },
    ],
  },
];

/**
 * Section 11, the last page of the chapter: a final panel stamped 完 (the end mark of a
 * manga chapter) that points at the next one, the docs, then the link columns under it.
 */
export function SiteFooter() {
  return (
    <footer data-landing="footer" className="mt-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pt-16 pb-12 sm:px-6 md:pt-24">
        <Panel
          caption="Last page"
          className="relative isolate grid grid-cols-12 items-end gap-x-6 gap-y-8 overflow-hidden bg-paper px-6 pt-16 pb-10 sm:px-10 sm:pt-20 sm:pb-14"
        >
          <FocusLines center={[88, 70]} count={64} length="long" className="opacity-10" />
          <div className="col-span-12 flex flex-col gap-5 sm:col-span-8">
            <h2 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-balance">
              End of chapter one.
            </h2>
            <p className="max-w-md text-lg text-pretty">
              The docs pick up where this leaves off: every component with a live demo, its props
              and the command that installs it.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/docs" size="lg">
                Turn to the docs
              </ButtonLink>
              <ButtonLink href="/create" variant="outline" size="lg">
                Make a theme
              </ButtonLink>
            </div>
          </div>
          <div className="col-span-12 flex justify-end sm:col-span-4" lang="ja">
            <Stamp vertical size="lg" rotate={-10} aria-label="完, the end">
              完
            </Stamp>
          </div>
        </Panel>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="font-display text-xl">mangacn</p>
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">
              Manga-styled React components, distributed as a shadcn registry. MIT.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-1 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 underline-offset-4 hover:text-spot hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
