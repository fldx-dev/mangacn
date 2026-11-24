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
const FILES = ["page.tsx", "components/login-form.tsx"];

describe("LoginForm", () => {
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

  it("is a form named by its heading, with stock's fields, buttons and links", () => {
    render(<LoginForm />);
    const heading = screen.getByRole("heading", { level: 1, name: "Welcome back" });
    const form = screen.getByRole("form", { name: "Welcome back" });
    expect(form.getAttribute("aria-labelledby")).toBe(heading.id);
    for (const label of ["Email", "Password"]) {
      expect(within(form).getByLabelText(label).hasAttribute("required"), label).toBe(true);
    }
    expect(
      within(form)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Login", "Login with Apple", "Login with Google", "Login with Meta"]);
    expect(within(form).getByRole("button", { name: "Login" }).getAttribute("type")).toBe("submit");
    expect(screen.getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe("/signup");
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
  });

  it("keeps stock's social marks in the current ink colour, hidden behind their labels", () => {
    render(<LoginForm />);
    for (const name of ["Login with Apple", "Login with Google", "Login with Meta"]) {
      // The button's own ink frame is an SVG too; stock's mark is the 24-unit one.
      const svgs = screen
        .getByRole("button", { name })
        .querySelectorAll('svg[viewBox="0 0 24 24"]');
      expect(svgs, name).toHaveLength(1);
      expect(svgs[0].getAttribute("aria-hidden")).toBe("true");
      for (const p of svgs[0].querySelectorAll("path"))
        expect(p.getAttribute("fill")).toBe("currentColor");
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

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});

describe("login-04 page", () => {
  it("is the page's one main, holding the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(within(main).getByRole("form", { name: "Welcome back" })).toBeTruthy();
    // Stock's muted ground: tone-1 in mangacn.
    expect(main.classList.contains("bg-muted")).toBe(true);
  });

  it("draws its cover as a manga panel of shipped items, decorative and hidden under md", () => {
    const { container } = render(<Page />);
    const frame = container.querySelector('[data-slot="manga-frame"]') as HTMLElement;
    const cover = frame.closest("[aria-hidden]") as HTMLElement;
    expect(cover.getAttribute("aria-hidden")).toBe("true");
    expect(cover.className).toMatch(/(^| )hidden( |$)/);
    expect(cover.className).toContain("md:flex");
    for (const slot of ["halftone-background", "focus-lines", "sfx-text"]) {
      expect(frame.querySelectorAll(`[data-slot="${slot}"]`), slot).toHaveLength(1);
    }
    expect(container.querySelector("img")).toBeNull();
  });

  it("has no brand colour in any SVG, and draws nothing of its own", () => {
    for (const file of FILES) {
      expect(source(file), file).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsl\(|oklch\(/i);
      expect(source(file), file).not.toMatch(/(fill|stroke)="(?!currentColor")/);
      expect(source(file), file).not.toMatch(/<img|shadow-|border-|text-spot|gradient/);
    }
  });

  it("imports its form relatively, installed at the path that holds after shadcn add", () => {
    expect(source("page.tsx")).toContain('from "./components/login-form"');
    expect(installedPageSource("login-04")).toContain('from "@/components/login-form"');
  });

  it("is a server component, and so is the form", () => {
    for (const file of FILES) expect(hasUseClientDirective(source(file)), file).toBe(false);
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
