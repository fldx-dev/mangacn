import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

// Navbar options shared by the landing (HomeLayout) and the docs (DocsLayout).
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <span className="font-display text-lg leading-none">mangacn</span>,
    },
    links: [
      { text: "Docs", url: "/docs" },
      { text: "Components", url: "/docs/components" },
      { text: "Theme", url: "/docs/theming" },
    ],
    githubUrl: "https://github.com/fldx-dev/mangacn",
    themeSwitch: { enabled: true },
    searchToggle: { enabled: true },
  };
}
