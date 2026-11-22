import Link from "next/link";
import { FocusLines } from "@/registry/ui/focus-lines/focus-lines";
import { Stamp } from "@/registry/ui/stamp/stamp";
import { VerticalText } from "@/registry/ui/vertical-text/vertical-text";
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
      { label: "Gallery", href: "/gallery" },
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
 * Section 11, the chapter's last page, set the way a volume ends: the page goes to solid ink,
 * a 完 (the end mark of a chapter) fills it edge to edge with a red misprint under it, and a
 * vertical line says the story goes on in the docs. The theme is inverted inside
 * (`.landing-invert`), so the registry buttons and links draw in paper on ink by themselves.
 */
export function SiteFooter() {
  return (
    <footer
      data-landing="footer"
      className="landing-invert relative isolate mt-auto overflow-hidden bg-paper text-ink"
    >
      <FocusLines center={[80, 46]} count={96} length="long" className="opacity-[0.12]" />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-x-6 gap-y-10 px-4 pt-24 pb-10 sm:px-6 md:pt-36">
        <div className="col-span-12 flex flex-col gap-6 md:col-span-8 md:row-start-1">
          <p className="flex items-center gap-3 font-display text-sm">
            <span lang="ja">第1話</span>
            <span aria-hidden="true" className="h-px w-10 bg-ink" />
            <span>The end</span>
          </p>
          <h2 className="font-display text-[clamp(3rem,10vw,8.5rem)] leading-[0.88] tracking-[-0.025em] text-balance">
            End of chapter one.
          </h2>
          <p className="max-w-md text-lg text-pretty">
            The docs pick up where this leaves off: every component with its live variants, its
            props and the command that installs it.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/docs" size="lg">
              Turn to the docs
            </ButtonLink>
            <ButtonLink href="/create" variant="outline" size="lg">
              Make a theme
            </ButtonLink>
            <span lang="ja" className="ml-2">
              <Stamp vertical size="sm" rotate={-12} aria-label="完, the end">
                完
              </Stamp>
            </span>
          </div>
        </div>

        {/* The end mark, as big as the page allows: a paper outline over a solid red misprint.
            On a phone it is its own beat under the buttons; from md it fills the right side. */}
        <div
          aria-hidden="true"
          lang="ja"
          className="-z-1 pointer-events-none relative col-span-12 -mt-4 select-none justify-self-end font-display text-[62vw] leading-none md:absolute md:top-[7%] md:-right-[9vw] md:mt-0 md:text-[min(46vw,34rem)]"
        >
          <span className="absolute inset-0 translate-x-[0.035em] translate-y-[0.035em] text-spot opacity-90">
            完
          </span>
          <span className="landing-outline relative">完</span>
        </div>

        {/* "To be continued, in the docs", down the page's outer edge like a closing caption. */}
        <div
          lang="ja"
          className="col-span-12 hidden justify-center md:col-span-1 md:col-start-9 md:row-start-1 md:flex md:justify-start md:pt-10"
        >
          <VerticalText className="font-display text-xl tracking-[0.3em]">
            次回、ドキュメントへ続く。
          </VerticalText>
        </div>

        <div className="col-span-12 mt-10 grid gap-10 border-ink/25 border-t pt-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="font-display text-2xl">mangacn</p>
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
                      className="inline-block py-1 underline-offset-4 transition-[translate,color] duration-200 hover:translate-x-1 hover:text-spot hover:underline motion-reduce:transition-none"
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
