import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

// Navbar options shared by the landing (HomeLayout) and the docs (DocsLayout).
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // The hand-inked logo (brand/logo/mangacn-horizontal-small*.svg), one file per theme.
      // The images are decorative; the visually hidden name is what screen readers and tests read.
      title: (
        <>
          <Image
            src="/brand/logo.svg"
            alt=""
            aria-hidden
            width={125}
            height={28}
            unoptimized
            loading="eager"
            className="h-7 w-auto dark:hidden"
          />
          <Image
            src="/brand/logo-dark.svg"
            alt=""
            aria-hidden
            width={125}
            height={28}
            unoptimized
            loading="eager"
            className="hidden h-7 w-auto dark:block"
          />
          <span className="sr-only">mangacn</span>
        </>
      ),
    },
    links: [
      { text: "Docs", url: "/docs" },
      { text: "Components", url: "/docs/components" },
      { text: "Create", url: "/create" },
      { text: "Theme", url: "/docs/theming" },
    ],
    githubUrl: "https://github.com/fldx-dev/mangacn",
    themeSwitch: { enabled: true },
    searchToggle: { enabled: true },
  };
}
