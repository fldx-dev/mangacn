import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import HelloWorldDefaultDemo from "./demos/default";
import { HelloWorld } from "./hello-world";

afterEach(cleanup);

describe("HelloWorld", () => {
  it("renders the given name", () => {
    render(<HelloWorld name="mangacn" />);
    expect(screen.getByText("Hello, mangacn!")).toBeDefined();
  });

  it("falls back to 'world'", () => {
    render(<HelloWorld />);
    expect(screen.getByText("Hello, world!")).toBeDefined();
  });

  it("forwards className and sets data-slot", () => {
    render(<HelloWorld className="custom-class" />);
    const el = screen.getByText("Hello, world!");
    expect(el.getAttribute("data-slot")).toBe("hello-world");
    expect(el.classList.contains("custom-class")).toBe(true);
    expect(el.classList.contains("rounded-md")).toBe(true);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<HelloWorldDefaultDemo />);
  });
});
