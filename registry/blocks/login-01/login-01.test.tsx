import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { LoginForm } from "./components/login-form";
import Page from "./page";

afterEach(cleanup);

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

describe("LoginForm", () => {
  it("is a form named by its heading, with an email and a password field", () => {
    render(<LoginForm />);
    const heading = screen.getByRole("heading", { level: 1, name: "Login to your account" });
    const form = screen.getByRole("form", { name: "Login to your account" });
    expect(form.getAttribute("aria-labelledby")).toBe(heading.id);
    const email = within(form).getByLabelText("Email");
    expect(email.getAttribute("type")).toBe("email");
    expect(email.hasAttribute("required")).toBe(true);
    const password = within(form).getByLabelText("Password");
    expect(password.getAttribute("type")).toBe("password");
    expect(password.hasAttribute("required")).toBe(true);
    expect(within(form).getByRole("button", { name: "Login" }).getAttribute("type")).toBe("submit");
    expect(
      within(form).getByRole("button", { name: "Login with Google" }).getAttribute("type"),
    ).toBe("button");
    expect(within(form).getByRole("link", { name: "Forgot your password?" })).toBeTruthy();
    expect(within(form).getByRole("link", { name: "Sign up" })).toBeTruthy();
  });

  it("draws with the items: a heavy-outlined card, the title in the display face, one stamp", () => {
    const { container } = render(<LoginForm className="mx-auto" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("mx-auto")).toBe(true);
    const card = root.querySelector('[data-slot="card"]') as HTMLElement;
    expect(card.className).toContain(
      "[&>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]",
    );
    expect(card.querySelector(':scope > [data-slot="ink-frame"]')).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
    // One stamp, Japanese under lang="ja", a decoration the reader skips.
    const stamps = root.querySelectorAll('[data-slot="stamp"]');
    expect(stamps).toHaveLength(1);
    expect(stamps[0].getAttribute("lang")).toBe("ja");
    expect(stamps[0].getAttribute("aria-hidden")).toBe("true");
    for (const slot of ["field", "input", "button"]) {
      expect(root.querySelector(`[data-slot="${slot}"]`), slot).toBeTruthy();
    }
  });

  it("draws nothing of its own: no SVG, border, shadow or colour classes in the block's files", () => {
    for (const file of ["page.tsx", "components/login-form.tsx"]) {
      const code = source(file);
      expect(code, file).not.toMatch(/<svg|shadow-|border-|bg-(?!paper)|text-spot|gradient/);
    }
  });

  it("gives each form its own heading id", () => {
    render(
      <>
        <LoginForm />
        <LoginForm />
      </>,
    );
    const ids = screen.getAllByRole("heading", { level: 1 }).map((heading) => heading.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("is a server component, and so is the page", () => {
    expect(hasUseClientDirective(source("components/login-form.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});

describe("login-01 page", () => {
  it("is the page's one main, holding the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(within(main).getByRole("form", { name: "Login to your account" })).toBeTruthy();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("imports its form from the install path, which holds after shadcn add", () => {
    expect(source("page.tsx")).toContain('from "@/components/login-form"');
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
