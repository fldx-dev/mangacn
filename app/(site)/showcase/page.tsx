import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/docs/layout.shared";
import { source } from "@/lib/docs/source";
import { SHOWCASE, SHOWCASE_REPOSITORY_URL, type ShowcaseExample } from "@/lib/showcase";
import { OG_IMAGE } from "@/lib/site";
import { Button } from "@/registry/ui/button/button";
import { Panel } from "@/registry/ui/panel/panel";

const DESCRIPTION =
  "Example sites built with mangacn: a webcomic reader, a creator dashboard, an artist portfolio and a fan landing page, each with its source and the items it uses.";

export const metadata: Metadata = {
  title: "Showcase",
  description: DESCRIPTION,
  alternates: { canonical: "/showcase" },
  // Replaces the root's whole openGraph object (metadata merges shallowly).
  openGraph: {
    type: "website",
    siteName: "mangacn",
    url: "/showcase",
    title: "Showcase · mangacn",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

/** An item's docs page: the theming page for the theme and its presets, else its own page. */
function itemHref(name: string): string | undefined {
  if (name === "theme" || name.startsWith("theme-")) return "/docs/theming";
  return (source.getPage(["components", name]) ?? source.getPage(["blocks", name]))?.url;
}

const LINK = "underline decoration-tone-3 underline-offset-4 hover:text-spot hover:decoration-spot";

/**
 * A link that leaves the site in a new tab, drawn as the registry Button. Base UI gives a
 * non-native button `role="button"`; `role="link"` overrides it so it is announced as a link.
 */
function ExternalButton({
  href,
  children,
  variant,
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      variant={variant}
      nativeButton={false}
      role="link"
      render={<a href={href} target="_blank" rel="noopener noreferrer" />}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </Button>
  );
}

function Example({ example }: { example: ShowcaseExample }) {
  const headingId = `showcase-${example.id}`;
  return (
    <Panel as="article" aria-labelledby={headingId} caption={example.kind} className="gap-4">
      <div className="ink-border overflow-hidden">
        <Image
          src={example.screenshot}
          alt={`${example.title} at desktop width`}
          width={1280}
          height={800}
          sizes="(min-width: 1152px) 540px, (min-width: 768px) 46vw, 92vw"
          className="block h-auto w-full"
        />
      </div>
      <h2 id={headingId} className="font-display text-2xl text-balance">
        {example.title}
      </h2>
      <p className="text-pretty">{example.description}</p>
      {example.note ? (
        <p className="font-dialogue text-sm text-muted-foreground text-pretty">{example.note}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-sm">mangacn items</h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm">
          {example.items.map((name) => {
            const href = itemHref(name);
            return (
              <li key={name}>
                {href ? (
                  <Link href={href} className={LINK}>
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-auto flex flex-wrap gap-3 pt-2">
        <ExternalButton href={example.sourceUrl} variant="outline">
          Source on GitHub
        </ExternalButton>
        {example.liveUrl ? <ExternalButton href={example.liveUrl}>Live site</ExternalButton> : null}
      </div>
    </Panel>
  );
}

// The Showcase: sites built with mangacn, from lib/showcase.ts, each with a shot, the items it
// installs (linked to their docs) and its source folder.
export default function Showcase() {
  return (
    <HomeLayout {...baseOptions()} aria-label="Showcase">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 text-ink sm:px-6 md:py-16">
        <header className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-4xl sm:text-5xl">Showcase</h1>
          <p className="text-lg text-pretty">
            Whole sites built from mangacn items, installed with the shadcn CLI and composed as they
            ship. Each one is a standalone Next.js app in the{" "}
            <a href={SHOWCASE_REPOSITORY_URL} className={LINK}>
              mangacn-showcase
            </a>{" "}
            repository.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
          {SHOWCASE.map((example) => (
            <Example key={example.id} example={example} />
          ))}
        </div>
      </div>
    </HomeLayout>
  );
}
