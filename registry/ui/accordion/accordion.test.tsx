import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

afterEach(cleanup);

function Faq() {
  return (
    <Accordion defaultValue={["one"]} className="custom-class">
      <AccordionItem value="one">
        <AccordionTrigger>First question</AccordionTrigger>
        <AccordionContent>First answer</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Second question</AccordionTrigger>
        <AccordionContent>Second answer</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("renders stock slots, roles and a forwarded className", () => {
    render(<Faq />);
    const first = screen.getByRole("button", { name: "First question" });
    expect(first.getAttribute("data-slot")).toBe("accordion-trigger");
    expect(first.getAttribute("aria-expanded")).toBe("true");
    const item = first.closest('[data-slot="accordion-item"]');
    expect(item?.parentElement?.getAttribute("data-slot")).toBe("accordion");
    expect(item?.parentElement?.classList.contains("custom-class")).toBe(true);
    expect(screen.getByText("First answer").closest('[data-slot="accordion-content"]')).not.toBe(
      null,
    );
  });

  it("rules items with hand-drawn lines, hidden after the last item", () => {
    render(<Faq />);
    const items = document.querySelectorAll<HTMLElement>('[data-slot="accordion-item"]');
    for (const item of items) {
      expect(item.className).not.toMatch(/border-b/);
      expect(item.classList.contains("not-last:*:data-[slot=ink-frame]:block")).toBe(true);
      const rule = item.querySelector(':scope > [data-slot="ink-frame"]');
      expect(rule?.getAttribute("data-shape")).toBe("line");
      expect(rule?.classList.contains("hidden")).toBe(true);
    }
  });

  it("swaps the chevrons for a + / − ink glyph in the same icon slot", () => {
    render(<Faq />);
    const trigger = screen.getByRole("button", { name: "First question" });
    const icons = trigger.querySelectorAll('[data-slot="accordion-trigger-icon"]');
    expect(icons).toHaveLength(2);
    expect(icons[0]?.getAttribute("class")).toContain("lucide-plus");
    expect(icons[1]?.getAttribute("class")).toContain("lucide-minus");
  });

  it("greys a disabled item by what Base UI sets: native disabled and data-disabled", () => {
    render(
      <Accordion>
        <AccordionItem value="one" disabled>
          <AccordionTrigger>Locked question</AccordionTrigger>
          <AccordionContent>Locked answer</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Locked question" });
    expect(trigger.hasAttribute("disabled")).toBe(true);
    expect(trigger.hasAttribute("data-disabled")).toBe(true);
    expect(trigger.hasAttribute("aria-disabled")).toBe(false);
    expect(trigger.className).not.toContain("aria-disabled:");
    for (const name of [
      "data-disabled:pointer-events-none",
      "data-disabled:text-muted-foreground",
    ]) {
      expect(trigger.classList.contains(name), name).toBe(true);
    }
    // The + / − glyph takes the trigger's colour, so it greys with the label.
    expect(trigger.className).not.toContain("accordion-trigger-icon]:text-");
  });

  it("toggles with Enter and Space, like stock", async () => {
    render(<Faq />);
    const second = screen.getByRole("button", { name: "Second question" });
    act(() => second.focus());
    fireEvent.keyDown(second, { key: "Enter" });
    fireEvent.click(second);
    await act(async () => {});
    expect(second.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(second, { key: " " });
    fireEvent.keyUp(second, { key: " " });
    fireEvent.click(second);
    await act(async () => {});
    expect(second.getAttribute("aria-expanded")).toBe("false");
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
