import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { SignupForm } from "./components/signup-form";
import Page from "./page";

afterEach(cleanup);

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

describe("SignupForm", () => {
  it("is a form named by its heading, with stock's four labelled fields", () => {
    render(<SignupForm />);
    const heading = screen.getByRole("heading", { level: 1, name: "Create an account" });
    const form = screen.getByRole("form", { name: "Create an account" });
    expect(form.getAttribute("aria-labelledby")).toBe(heading.id);
    const fields = [
      ["Full Name", "text"],
      ["Email", "email"],
      ["Password", "password"],
      ["Confirm Password", "password"],
    ] as const;
    for (const [label, type] of fields) {
      const input = within(form).getByLabelText(label);
      expect(input.getAttribute("type"), label).toBe(type);
      expect(input.hasAttribute("required"), label).toBe(true);
    }
    expect(within(form).getByRole("button", { name: "Create Account" }).getAttribute("type")).toBe(
      "submit",
    );
    expect(
      within(form).getByRole("button", { name: "Sign up with Google" }).getAttribute("type"),
    ).toBe("button");
  });

  it("links back to the login page, as login-01 links here", () => {
    render(<SignupForm />);
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
  });

  it("is stock's card: its props and class reach the card", () => {
    const { container } = render(<SignupForm className="mx-auto" data-testid="signup" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute("data-slot")).toBe("card");
    expect(card.getAttribute("data-testid")).toBe("signup");
    expect(card.classList.contains("mx-auto")).toBe(true);
  });

  it("draws with the items: a heavy-outlined card, the title in the display face, one stamp", () => {
    const { container } = render(<SignupForm />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain(
      "[&>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]",
    );
    expect(card.querySelector(':scope > [data-slot="ink-frame"]')).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
    // One stamp, Japanese under lang="ja", a decoration the reader skips.
    const stamps = card.querySelectorAll('[data-slot="stamp"]');
    expect(stamps).toHaveLength(1);
    expect(stamps[0].getAttribute("lang")).toBe("ja");
    expect(stamps[0].getAttribute("aria-hidden")).toBe("true");
    for (const slot of ["field", "input", "button"]) {
      expect(card.querySelector(`[data-slot="${slot}"]`), slot).toBeTruthy();
    }
  });

  it("draws nothing of its own: no SVG, border, shadow or colour classes in the block's files", () => {
    for (const file of ["page.tsx", "components/signup-form.tsx"]) {
      const code = source(file);
      expect(code, file).not.toMatch(/<svg|shadow-|border-|bg-(?!paper)|text-spot|gradient/);
    }
  });

  it("gives each form its own heading id", () => {
    render(
      <>
        <SignupForm />
        <SignupForm />
      </>,
    );
    const ids = screen.getAllByRole("heading", { level: 1 }).map((heading) => heading.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("is a server component, and so is the page", () => {
    expect(hasUseClientDirective(source("components/signup-form.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});

describe("signup-01 page", () => {
  it("is the page's one main, holding the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("form", { name: "Create an account" })).toBeTruthy();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("imports its form from the install path, which holds after shadcn add", () => {
    expect(source("page.tsx")).toContain('from "@/components/signup-form"');
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
