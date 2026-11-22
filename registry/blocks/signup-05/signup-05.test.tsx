import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import { SignupForm } from "./components/signup-form";
import Page from "./page";

afterEach(cleanup);

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");
const FILES = ["page.tsx", "components/signup-form.tsx"];

describe("SignupForm", () => {
  it("is a form named by its heading, with stock's fields, buttons and links", () => {
    render(<SignupForm />);
    const heading = screen.getByRole("heading", { level: 1, name: "Welcome to Inkpot Studio." });
    const form = screen.getByRole("form", { name: "Welcome to Inkpot Studio." });
    expect(form.getAttribute("aria-labelledby")).toBe(heading.id);
    for (const label of ["Email"]) {
      expect(within(form).getByLabelText(label).hasAttribute("required"), label).toBe(true);
    }
    expect(
      within(form)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Create Account", "Continue with Apple", "Continue with Google"]);
    expect(within(form).getByRole("button", { name: "Create Account" }).getAttribute("type")).toBe(
      "submit",
    );
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
  });

  it("keeps stock's social marks in the current ink colour, hidden behind their labels", () => {
    render(<SignupForm />);
    for (const name of ["Continue with Apple", "Continue with Google"]) {
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

  it("draws the studio's mark in ink, a link named by its sr-only label", () => {
    render(<SignupForm />);
    const brand = screen.getByRole("link", { name: "Inkpot Studio" });
    expect(brand.querySelector("svg.lucide")?.getAttribute("aria-hidden")).toBe("true");
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

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});

describe("signup-05 page", () => {
  it("is the page's one main, holding the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(within(main).getByRole("form", { name: "Welcome to Inkpot Studio." })).toBeTruthy();
  });

  it("has no brand colour in any SVG, and draws nothing of its own", () => {
    for (const file of FILES) {
      expect(source(file), file).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsl\(|oklch\(/i);
      expect(source(file), file).not.toMatch(/(fill|stroke)="(?!currentColor")/);
      expect(source(file), file).not.toMatch(/<img|shadow-|border-|text-spot|gradient/);
    }
  });

  it("imports its form relatively, installed at the path that holds after shadcn add", () => {
    expect(source("page.tsx")).toContain('from "./components/signup-form"');
    expect(installedPageSource("signup-05")).toContain('from "@/components/signup-form"');
  });

  it("is a server component, and so is the form", () => {
    for (const file of FILES) expect(hasUseClientDirective(source(file)), file).toBe(false);
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
