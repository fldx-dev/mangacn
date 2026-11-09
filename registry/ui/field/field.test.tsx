import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { Input } from "@/registry/ui/input/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Field", () => {
  it("renders stock slots, roles and orientation with forwarded classNames", () => {
    render(
      <FieldSet className="custom-set">
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal" className="custom-field">
            <FieldContent>
              <FieldTitle>Title</FieldTitle>
              <FieldDescription>Help</FieldDescription>
            </FieldContent>
          </Field>
          <FieldSeparator>or</FieldSeparator>
        </FieldGroup>
      </FieldSet>,
    );
    const set = screen.getByRole("group", { name: "Profile" });
    expect(set.tagName).toBe("FIELDSET");
    expect(set.getAttribute("data-slot")).toBe("field-set");
    expect(set.classList.contains("custom-set")).toBe(true);
    const legend = screen.getByText("Profile");
    expect(legend.getAttribute("data-slot")).toBe("field-legend");
    expect(legend.getAttribute("data-variant")).toBe("legend");
    const field = document.querySelector<HTMLElement>('[data-slot="field"]');
    expect(field?.getAttribute("role")).toBe("group");
    expect(field?.getAttribute("data-orientation")).toBe("horizontal");
    expect(field?.classList.contains("custom-field")).toBe(true);
    for (const slot of ["field-group", "field-content", "field-description", "field-separator"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(screen.getByText("Title").getAttribute("data-slot")).toBe("field-label");
  });

  it("sets the legend in the display face; labels stay in the body face", () => {
    render(
      <FieldSet>
        <FieldLegend>Reading</FieldLegend>
        <Field>
          <FieldLabel htmlFor="t">Title</FieldLabel>
          <Input id="t" />
        </Field>
      </FieldSet>,
    );
    expect(screen.getByText("Reading").classList.contains("font-display")).toBe(true);
    const label = screen.getByText("Title");
    expect(label.getAttribute("data-slot")).toBe("field-label");
    expect(label.classList.contains("font-display")).toBe(false);
    expect(screen.getByLabelText("Title").getAttribute("data-slot")).toBe("input");
  });

  it("announces an error as stock: role alert with the message", () => {
    render(
      <Field data-invalid="true">
        <FieldLabel htmlFor="pen">Pen name</FieldLabel>
        <Input id="pen" aria-invalid="true" />
        <FieldError>Use 3 letters or more.</FieldError>
      </Field>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("data-slot")).toBe("field-error");
    expect(alert.textContent).toBe("Use 3 letters or more.");
    expect(alert.classList.contains("text-destructive")).toBe(true);
  });

  it("lists several errors, deduplicated, and renders nothing without one", () => {
    const { rerender } = render(
      <FieldError errors={[{ message: "Too short" }, { message: "Too short" }]} />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Too short");
    rerender(<FieldError errors={[{ message: "Too short" }, { message: "Taken" }]} />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Too short",
      "Taken",
    ]);
    rerender(<FieldError errors={[]} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("draws a spot ink underline once, under the control, hidden from assistive tech", () => {
    render(<FieldError>Use 3 letters or more.</FieldError>);
    const mark = screen.getByRole("alert").querySelector<HTMLElement>('[data-slot="ink-mark"]');
    expect(mark?.dataset.kind).toBe("underline");
    expect(mark?.dataset.color).toBe("spot");
    // On at mount: the strokes appear drawn, with no draw-on animation.
    expect(mark?.dataset.show).toBe("true");
    expect(mark?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(mark?.textContent).toBe("");
  });

  it("keeps the frames of the controls inside: a field is not a group", () => {
    render(
      <Field>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Input id="title" />
      </Field>,
    );
    const frame = screen.getByRole("textbox").parentElement;
    expect(frame?.getAttribute("data-slot")).toBe("ink-frame");
    expect(frame?.closest("[data-grouped]")).toBeNull();
  });

  it("outlines a choice card with an ink frame shown only around a nested field", () => {
    render(
      <FieldLabel htmlFor="page">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Page by page</FieldTitle>
          </FieldContent>
        </Field>
      </FieldLabel>,
    );
    const label = document.querySelector<HTMLElement>('label[data-slot="field-label"]');
    const frame = label?.firstElementChild;
    expect(frame?.getAttribute("data-slot")).toBe("ink-frame");
    expect(frame?.getAttribute("data-fill")).toBe("none");
    expect(frame?.classList.contains("hidden")).toBe(true);
    expect(frame?.classList.contains("group-has-[>[data-slot=field]]/field-label:block")).toBe(
      true,
    );
    for (const name of label?.classList ?? []) {
      expect(name, name).not.toMatch(/(^|:)border(-primary|$)/);
    }
  });

  it("draws FieldSeparator with separator's hand-drawn rule and its content above it", () => {
    render(<FieldSeparator>or</FieldSeparator>);
    const separator = document.querySelector<HTMLElement>('[data-slot="field-separator"]');
    expect(separator?.getAttribute("data-content")).toBe("true");
    const rule = separator?.querySelector('[data-slot="separator"]');
    expect(rule?.querySelector('[data-slot="ink-frame"]')?.getAttribute("data-shape")).toBe("line");
    expect(screen.getByText("or").getAttribute("data-slot")).toBe("field-separator-content");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
