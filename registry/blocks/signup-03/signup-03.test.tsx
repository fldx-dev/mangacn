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
  it("draws the title, description and footer it is given", () => {
    render(
      <SignupForm
        title="Join Ink Club"
        description="Use your club email"
        footer={<a href="/join">Join the club</a>}
      />,
    );
    expect(screen.getByRole("form", { name: "Join Ink Club" })).toBeTruthy();
    expect(screen.getByText("Use your club email")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Join the club" }).getAttribute("href")).toBe("/join");
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("holds the password to the 8 characters its description asks for", () => {
    const { container } = render(<SignupForm />);
    expect(container.textContent).toContain("Must be at least 8 characters long.");
    const password = container.querySelector("#password") as HTMLInputElement;
    expect(password.getAttribute("minlength")).toBe("8");
  });

  it("submits every field under its name: FormData holds what was typed", () => {
    const { container } = render(<SignupForm />);
    const expected = [
      ["name", "Ana Ink"],
      ["email", "ana@example.com"],
      ["password", "hunter2-ink"],
      ["confirm-password", "hunter2-ink"],
    ];
    for (const [id, value] of expected) {
      (container.querySelector(`#${id}`) as HTMLInputElement).value = value;
    }
    const form = container.querySelector("form") as HTMLFormElement;
    expect([...new FormData(form).entries()]).toEqual(expected);
  });

  it("is a form named by its heading, with stock's fields, buttons and links", () => {
    render(<SignupForm />);
    const heading = screen.getByRole("heading", { level: 1, name: "Create your account" });
    const form = screen.getByRole("form", { name: "Create your account" });
    expect(form.getAttribute("aria-labelledby")).toBe(heading.id);
    for (const label of ["Full Name", "Email", "Password", "Confirm Password"]) {
      expect(within(form).getByLabelText(label).hasAttribute("required"), label).toBe(true);
    }
    expect(
      within(form)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Create Account"]);
    expect(within(form).getByRole("button", { name: "Create Account" }).getAttribute("type")).toBe(
      "submit",
    );
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
  });

  it("draws the card at the heavy outline", () => {
    const { container } = render(<SignupForm />);
    const card = container.querySelector('[data-slot="card"]') as HTMLElement;
    expect(card.className).toContain("--outline-width-heavy");
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

describe("signup-03 page", () => {
  it("is the page's one main, holding the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(within(main).getByRole("form", { name: "Create your account" })).toBeTruthy();
    // Stock's muted ground: tone-1 in mangacn.
    expect(main.classList.contains("bg-muted")).toBe(true);
    expect(within(main).getByRole("link", { name: "Inkpot Studio" })).toBeTruthy();
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
    expect(installedPageSource("signup-03")).toContain('from "@/components/signup-form"');
  });

  it("is a server component, and so is the form", () => {
    for (const file of FILES) expect(hasUseClientDirective(source(file)), file).toBe(false);
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
