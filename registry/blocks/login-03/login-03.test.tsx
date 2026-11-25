import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import { LoginForm } from "./components/login-form";
import Page from "./page";

afterEach(cleanup);

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

describe("LoginForm", () => {
  it("draws the title, description, provider buttons and footer it is given", () => {
    render(
      <LoginForm
        title="Join Ink Club"
        description="Use your club email"
        providers={<button type="button">Continue with Ink ID</button>}
        footer={<a href="/join">Join the club</a>}
      />,
    );
    expect(screen.getByRole("form", { name: "Join Ink Club" })).toBeTruthy();
    expect(screen.getByText("Use your club email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Ink ID" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Login with Apple" })).toBeNull();
    expect(screen.getByRole("link", { name: "Join the club" }).getAttribute("href")).toBe("/join");
    expect(screen.queryByRole("link", { name: "Sign up" })).toBeNull();
  });

  it("draws no provider buttons, nor their rule, with providers={null}", () => {
    render(<LoginForm providers={null} />);
    expect(screen.queryByRole("button", { name: "Login with Apple" })).toBeNull();
    expect(screen.queryByText("Or continue with")).toBeNull();
    expect(screen.getByRole("button", { name: "Login" })).toBeTruthy();
  });

  it("draws the forgot-password link only where forgotPasswordHref points", () => {
    const { container, rerender } = render(<LoginForm />);
    expect(screen.queryByRole("link", { name: "Forgot your password?" })).toBeNull();
    rerender(<LoginForm forgotPasswordHref="/reset" />);
    const link = screen.getByRole("link", { name: "Forgot your password?" });
    expect(link.getAttribute("href")).toBe("/reset");
    expect(container.querySelector("[forgotpasswordhref]")).toBeNull();
  });

  it("submits every field under its name: FormData holds what was typed", () => {
    const { container } = render(<LoginForm />);
    const expected = [
      ["email", "ana@example.com"],
      ["password", "hunter2-ink"],
    ];
    for (const [id, value] of expected) {
      (container.querySelector(`#${id}`) as HTMLInputElement).value = value;
    }
    const form = container.querySelector("form") as HTMLFormElement;
    expect([...new FormData(form).entries()]).toEqual(expected);
  });

  it("is a form named by its heading: Apple, Google, then email and password", () => {
    render(<LoginForm />);
    const heading = screen.getByRole("heading", { level: 1, name: "Welcome back" });
    const form = screen.getByRole("form", { name: "Welcome back" });
    expect(form.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(within(form).getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(within(form).getByLabelText("Password").getAttribute("type")).toBe("password");
    const buttons = within(form).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Login with Apple",
      "Login with Google",
      "Login",
    ]);
    expect(within(form).getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe(
      "/signup",
    );
    expect(screen.getByRole("link", { name: "Terms of Service" })).toBeTruthy();
  });

  it("draws the card at the heavy outline, the title in the display face", () => {
    const { container } = render(<LoginForm />);
    const card = container.querySelector('[data-slot="card"]') as HTMLElement;
    expect(card.className).toContain("--outline-width-heavy");
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
    expect(card.querySelector('[data-slot="field-separator"]')).toBeTruthy();
  });

  it("keeps stock's Apple and Google marks in ink, hidden behind their labels", () => {
    render(<LoginForm />);
    for (const name of ["Login with Apple", "Login with Google"]) {
      const svgs = screen
        .getByRole("button", { name })
        .querySelectorAll('svg[viewBox="0 0 24 24"]');
      expect(svgs, name).toHaveLength(1);
      expect(svgs[0].getAttribute("aria-hidden")).toBe("true");
      for (const p of svgs[0].querySelectorAll("path")) {
        expect(p.getAttribute("fill")).toBe("currentColor");
      }
    }
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});

describe("login-03 page", () => {
  it("is the page's one main, on tone-1: the studio's mark and the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(main.classList.contains("bg-muted")).toBe(true);
    expect(within(main).getByRole("form", { name: "Welcome back" })).toBeTruthy();
    expect(within(main).getByRole("link", { name: "Inkpot Studio" })).toBeTruthy();
  });

  it("has no brand colour in any SVG, and draws nothing of its own", () => {
    for (const file of ["page.tsx", "components/login-form.tsx"]) {
      expect(source(file), file).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/i);
      expect(source(file), file).not.toMatch(/fill="(?!currentColor")|stroke="(?!currentColor")/);
      expect(source(file), file).not.toMatch(/<img|shadow-|border-|text-spot|gradient/);
    }
  });

  it("imports its form relatively, installed at the path that holds after shadcn add", () => {
    expect(source("page.tsx")).toContain('from "./components/login-form"');
    expect(installedPageSource("login-03")).toContain('from "@/components/login-form"');
  });

  it("is a server component, and so is the form", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/login-form.tsx"))).toBe(false);
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
