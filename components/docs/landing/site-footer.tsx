import Link from "next/link";
import { Separator } from "@/registry/ui/separator/separator";

const GITHUB = "https://github.com/fldx-dev/mangacn";

const COLUMNS = [
  {
    title: "Docs",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "Theming", href: "/docs/theming" },
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

/** Section 9: a hand-drawn rule, three link columns, the licence and the Pro line. */
export function SiteFooter() {
  return (
    <footer data-landing="footer" className="mt-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-4 pb-12 sm:px-6">
        <Separator />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl">mangacn</h2>
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">
              Manga-styled React components, distributed as a shadcn registry. MIT.
            </p>
            <p className="text-sm text-muted-foreground">Pro: blocks and templates, later.</p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="underline-offset-4 hover:text-spot hover:underline"
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
