import { cleanup, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterCard } from "./character-card/character-card";
import { LoginForm } from "./login-02/components/login-form";
import LoginPage from "./login-02/page";
import { SeriesHeader } from "./series-page/components/series-header";
import Sidebar11Page from "./sidebar-11/page";
import Sidebar15Page from "./sidebar-15/page";

// A user who swaps `lib/link.tsx` for their router's link gets every internal link of a block
// through it: stand in a router link that marks its anchor, and check the blocks render it.
vi.mock("@/lib/link", () => ({
  Link: (props: React.ComponentProps<"a">) => <a data-router-link="" {...props} />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// jsdom has no matchMedia, which the sidebar's useIsMobile reads (as in the sidebar tests).
function stubDesktop() {
  vi.stubGlobal("innerWidth", 1280);
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

/** The anchors on the page that did not come through the mocked Link. */
const plainAnchors = () =>
  [...document.querySelectorAll("a")].filter((a) => !a.hasAttribute("data-router-link"));

const routed = (name: string) =>
  screen.getByRole("link", { name }).hasAttribute("data-router-link");

describe("blocks link to internal routes through @/lib/link", () => {
  it("character-card: the name's link", () => {
    render(
      <CharacterCard
        name="Mio Amano"
        portrait={{ src: "/mio.png", alt: "Mio" }}
        href="/characters/mio"
      />,
    );
    expect(routed("Mio Amano")).toBe(true);
  });

  it("series-page: Start reading, a Base UI button rendered as the link", () => {
    render(
      <SeriesHeader
        series={{
          title: "Lantern Keepers",
          author: "Hana Mori",
          synopsis: "Lanterns go out one by one.",
          status: "ongoing",
          cover: { src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", alt: "The cover" },
          startHref: "/read/1",
        }}
      />,
    );
    const link = screen.getByRole("link", { name: "Start reading" });
    expect(link.hasAttribute("data-router-link")).toBe(true);
    expect(link.getAttribute("href")).toBe("/read/1");
    expect(link.getAttribute("data-slot")).toBe("button");
  });

  it("login-02: the home mark, sign up and forgot password", () => {
    render(<LoginPage />);
    expect(routed("Inkpot Studio")).toBe(true);
    expect(routed("Sign up")).toBe(true);
    cleanup();
    render(<LoginForm forgotPasswordHref="/forgot" />);
    expect(routed("Forgot your password?")).toBe(true);
  });

  it("sidebar-11: the breadcrumb's links, through BreadcrumbLink's render prop", () => {
    stubDesktop();
    render(<Sidebar11Page />);
    expect(routed("chapter-12")).toBe(true);
    expect(routed("pages")).toBe(true);
  });

  it("sidebar-15: every link, workspaces and their pages included", () => {
    stubDesktop();
    render(<Sidebar15Page />);
    expect(document.querySelectorAll("a[data-router-link]").length).toBeGreaterThan(0);
    expect(plainAnchors()).toEqual([]);
  });
});
