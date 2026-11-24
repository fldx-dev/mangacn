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
      within(form).getByRole("button", { name: "Login with GitHub" }).getAttribute("type"),
    ).toBe("button");
    expect(within(form).getByRole("link", { name: "Sign up" })).toBeTruthy();
  });

  it("draws with the items: the title in the display face, fields, buttons and separator", () => {
    const { container } = render(<LoginForm className="mx-auto" />);
    const form = container.firstElementChild as HTMLElement;
    expect(form.tagName).toBe("FORM");
    expect(form.classList.contains("mx-auto")).toBe(true);
    expect(screen.getByRole("heading", { level: 1 }).classList.contains("font-display")).toBe(true);
    for (const slot of ["field", "input", "button", "field-separator"]) {
      expect(form.querySelector(`[data-slot="${slot}"]`), slot).toBeTruthy();
    }
  });

  it("keeps stock's GitHub mark in the current ink colour, hidden behind its label", () => {
    render(<LoginForm />);
    const github = screen.getByRole("button", { name: "Login with GitHub" });
    // The button's own ink frame is an SVG too; stock's mark is the 24-unit one.
    const svgs = github.querySelectorAll('svg[viewBox="0 0 24 24"]');
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute("aria-hidden")).toBe("true");
    for (const path of svgs[0].querySelectorAll("path")) {
      expect(path.getAttribute("fill")).toBe("currentColor");
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

describe("login-02 page", () => {
  it("is the page's one main: the studio's mark and the form", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(within(main).getByRole("form", { name: "Login to your account" })).toBeTruthy();
    expect(within(main).getByRole("link", { name: "Inkpot Studio" })).toBeTruthy();
  });

  it("draws its cover as a manga panel of shipped items, decorative and hidden under lg", () => {
    const { container } = render(<Page />);
    const frame = container.querySelector('[data-slot="manga-frame"]') as HTMLElement;
    const cover = frame.closest("[aria-hidden]") as HTMLElement;
    expect(cover.getAttribute("aria-hidden")).toBe("true");
    expect(cover.className).toMatch(/(^| )hidden( |$)/);
    expect(cover.className).toContain("lg:flex");
    for (const slot of ["halftone-background", "focus-lines", "sfx-text"]) {
      expect(frame.querySelectorAll(`[data-slot="${slot}"]`), slot).toHaveLength(1);
    }
    expect(container.querySelector("img")).toBeNull();
  });

  it("draws nothing of its own: no SVG, border, shadow or colour classes in the page", () => {
    expect(source("page.tsx")).not.toMatch(/<svg|<img|shadow-|border-|bg-|text-spot|gradient/);
    expect(source("components/login-form.tsx")).not.toMatch(
      /shadow-|border-|bg-|text-spot|gradient/,
    );
  });

  it("imports its form relatively, installed at the path that holds after shadcn add", () => {
    expect(source("page.tsx")).toContain('from "./components/login-form"');
    expect(installedPageSource("login-02")).toContain('from "@/components/login-form"');
  });

  it("is a server component, and so is the form", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/login-form.tsx"))).toBe(false);
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
