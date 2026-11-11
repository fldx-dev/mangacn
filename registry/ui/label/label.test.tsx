import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible } from "@/lib/test/axe";
import { Label } from "./label";

afterEach(cleanup);

describe("Label", () => {
  it("renders a label with data-slot, htmlFor and a forwarded className", () => {
    render(
      <>
        <Label htmlFor="pen-name" className="custom-class">
          Pen name
        </Label>
        <input id="pen-name" />
      </>,
    );
    const label = screen.getByText("Pen name");
    expect(label.tagName.toLowerCase()).toBe("label");
    expect(label.dataset.slot).toBe("label");
    expect(label.classList.contains("custom-class")).toBe(true);
    expect(screen.getByLabelText("Pen name").id).toBe("pen-name");
  });

  it("keeps stock's classes and the body face", () => {
    render(<Label>Pen name</Label>);
    const label = screen.getByText("Pen name");
    for (const name of ["flex", "text-sm", "font-medium", "peer-disabled:opacity-50"]) {
      expect(label.classList.contains(name), name).toBe(true);
    }
    expect(label.className).not.toMatch(/font-(display|dialogue)/);
    expect(label.dataset.required).toBeUndefined();
    expect(label.querySelector(".text-spot")).toBeNull();
  });

  it("marks a required field with a spot asterisk hidden from assistive tech", () => {
    render(
      <>
        <Label htmlFor="title" required>
          Title
        </Label>
        <input id="title" required />
      </>,
    );
    const label = screen.getByText("Title");
    expect(label.dataset.required).toBe("true");
    const mark = label.querySelector("span");
    expect(mark?.textContent).toBe("*");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(mark?.classList.contains("text-spot")).toBe(true);
    // The accessible name stays the text alone.
    expect(screen.getByRole("textbox", { name: "Title" })).not.toBeNull();
  });

  it("is a server component: no directive, renders on the server with no hooks", () => {
    const source = readFileSync(path.resolve("registry/ui/label/label.tsx"), "utf8");
    expect(hasUseClientDirective(source)).toBe(false);
    const html = renderToStaticMarkup(<Label required>Pen name</Label>);
    expect(html).toMatch(/^<label data-slot="label" data-required="true"/);
    expect(html).toContain('Pen name<span aria-hidden="true" class="-ml-1.5 text-spot">*</span>');
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
