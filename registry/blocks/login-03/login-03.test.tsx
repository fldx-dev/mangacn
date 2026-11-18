import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { LoginForm } from "./components/login-form";
import Page from "./page";

afterEach(cleanup);

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

describe("LoginForm", () => {
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

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
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
