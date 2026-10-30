import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import AccordionDefaultDemo from "./demos/default";

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
    expect(trigger.className).toContain("**:data-[slot=accordion-trigger-icon]:text-foreground");
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

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<AccordionDefaultDemo />);
  });
});
