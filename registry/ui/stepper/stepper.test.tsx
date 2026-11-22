import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  type StepperProps,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./stepper";

afterEach(cleanup);

const TITLES = ["Cart", "Shipping", "Payment", "Review"];

function Example({
  errorAt,
  disabledAt,
  ...props
}: Partial<StepperProps> & { errorAt?: number; disabledAt?: number }) {
  return (
    <Stepper aria-label="Checkout" {...props}>
      {TITLES.map((title, index) => (
        <StepperItem
          key={title}
          step={index}
          error={index === errorAt}
          disabled={index === disabledAt}
        >
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>{title}</StepperTitle>
            <StepperDescription>About {title}</StepperDescription>
          </StepperTrigger>
          {index < TITLES.length - 1 ? <StepperSeparator /> : null}
        </StepperItem>
      ))}
      {TITLES.map((title, index) => (
        <StepperContent key={title} step={index}>
          {title} form
        </StepperContent>
      ))}
    </Stepper>
  );
}

function Controlled() {
  const [value, setValue] = React.useState(1);
  return (
    <>
      <Example value={value} onValueChange={setValue} />
      <button type="button" onClick={() => setValue(3)}>
        Jump
      </button>
    </>
  );
}

const items = () => screen.getAllByRole("listitem");
const trigger = (name: RegExp) => screen.getByRole("button", { name });

describe("Stepper", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  it("renders a labelled ordered list with a slot on every part", () => {
    const { container } = render(<Example defaultValue={1} />);
    const list = screen.getByRole("list", { name: "Checkout" });
    expect(list.tagName).toBe("OL");
    expect(list.dataset.slot).toBe("stepper");
    expect(list.dataset.orientation).toBe("horizontal");
    for (const slot of [
      "stepper-item",
      "stepper-trigger",
      "stepper-indicator",
      "stepper-title",
      "stepper-description",
      "stepper-separator",
      "stepper-content",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    // StepperContent renders after the list, not inside it.
    expect(list.querySelector('[data-slot="stepper-content"]')).toBeNull();
  });

  it("marks states, aria-current on the current step and names end with the state", () => {
    render(<Example defaultValue={1} />);
    expect(items().map((item) => item.dataset.state)).toEqual([
      "completed",
      "active",
      "inactive",
      "inactive",
    ]);
    expect(items()[1].getAttribute("aria-current")).toBe("step");
    expect(items()[0].hasAttribute("aria-current")).toBe(false);
    expect(trigger(/Cart/).textContent).toMatch(/^Step 1 of 4: .*Cart.*, completed$/);
    expect(trigger(/Shipping/).textContent).toMatch(/^Step 2 of 4: /);
    expect(screen.getByText("Shipping form")).toBeTruthy();
  });

  it("is linear by default: completed steps and the next one are buttons, later ones text", () => {
    render(<Example defaultValue={1} />);
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringContaining("Cart"),
      expect.stringContaining("Shipping"),
      expect.stringContaining("Payment"),
    ]);
    const review = screen.getByText("Review").closest('[data-slot="stepper-trigger"]');
    expect(review?.tagName).toBe("SPAN");
  });

  it("lets every step be chosen when linear is false, except a disabled one", () => {
    render(<Example linear={false} disabledAt={2} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /Payment/ })).toBeNull();
    expect(items()[2].hasAttribute("data-disabled")).toBe(true);
  });

  it("is uncontrolled from defaultValue (0 by default) and reports each choice", () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    expect(items()[0].dataset.state).toBe("active");
    fireEvent.click(trigger(/Shipping/));
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(items()[1].dataset.state).toBe("active");
    expect(screen.getByText("Shipping form")).toBeTruthy();
    expect(screen.queryByText("Cart form")).toBeNull();
    // Choosing the current step again reports nothing.
    fireEvent.click(trigger(/Shipping/));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("is controlled by value", () => {
    render(<Controlled />);
    fireEvent.click(trigger(/Cart/));
    expect(items()[0].dataset.state).toBe("active");
    fireEvent.click(screen.getByRole("button", { name: "Jump" }));
    expect(items()[3].dataset.state).toBe("active");
    expect(items()[2].dataset.state).toBe("completed");
  });

  it("Tab moves through the choosable steps only (native buttons, no roving tabindex)", () => {
    render(<Example defaultValue={1} />);
    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>("button, [tabindex]"),
    ).filter((element) => element.tabIndex >= 0 && !element.hasAttribute("disabled"));
    expect(focusable).toEqual([trigger(/Cart/), trigger(/Shipping/), trigger(/Payment/)]);
    for (const button of focusable) expect(button.getAttribute("type")).toBe("button");
    const review = screen.getByText("Review").closest('[data-slot="stepper-trigger"]');
    expect(review?.hasAttribute("tabindex")).toBe(false);
    // Enter and Space activate a native button, which chooses the step.
    trigger(/Payment/).focus();
    fireEvent.click(document.activeElement as HTMLElement);
    expect(items()[2].dataset.state).toBe("active");
    expect(document.activeElement).toBe(trigger(/Payment/));
  });

  it("draws an error step in spot with an icon and says error", () => {
    render(<Example defaultValue={2} errorAt={2} />);
    const payment = items()[2];
    expect(payment.hasAttribute("data-invalid")).toBe(true);
    const indicator = payment.querySelector('[data-slot="stepper-indicator"]');
    expect(indicator?.className).toContain("text-spot");
    expect(indicator?.querySelector("svg.lucide")).not.toBeNull();
    expect(trigger(/Payment/).textContent).toMatch(/, error$/);
  });

  it("indicators are hidden circles: number, ink when current, check when completed", () => {
    render(<Example defaultValue={1} />);
    const indicators = document.querySelectorAll('[data-slot="stepper-indicator"]');
    for (const indicator of indicators) expect(indicator.getAttribute("aria-hidden")).toBe("true");
    const frame = (i: number) => indicators[i].querySelector('[data-slot="ink-frame"]');
    expect(frame(0)?.getAttribute("data-shape")).toBe("ellipse");
    expect(indicators[0].querySelector("svg.lucide-check")).not.toBeNull();
    expect(frame(1)?.getAttribute("data-fill")).toBe("ink");
    expect(indicators[2].textContent).toBe("3");
    expect(frame(2)?.getAttribute("data-fill")).toBe("paper");
    const separator = document.querySelector('[data-slot="stepper-separator"]');
    expect(separator?.getAttribute("aria-hidden")).toBe("true");
    expect(separator?.querySelector('[data-shape="line"]')).not.toBeNull();
  });

  it("horizontal titles of other steps become screen-reader text under 768 px", () => {
    render(<Example defaultValue={1} />);
    const title = screen.getByText("Cart");
    expect(title.className).toContain(
      "max-md:group-data-[orientation=horizontal]/stepper:group-data-[state=completed]/stepper-item:sr-only",
    );
    expect(screen.getByText("About Cart").className).toContain(
      "max-md:group-data-[orientation=horizontal]/stepper:sr-only",
    );
  });

  it("puts vertical content under its item", () => {
    render(
      <Stepper aria-label="Wizard" orientation="vertical" defaultValue={0}>
        <StepperItem step={0}>
          <StepperTrigger>
            <StepperTitle>One</StepperTitle>
          </StepperTrigger>
          <StepperContent step={0}>First</StepperContent>
        </StepperItem>
        <StepperItem step={1}>
          <StepperTrigger>
            <StepperTitle>Two</StepperTitle>
          </StepperTrigger>
          <StepperContent step={1}>Second</StepperContent>
        </StepperItem>
      </Stepper>,
    );
    expect(screen.getByRole("list").dataset.orientation).toBe("vertical");
    expect(screen.getByText("First").closest("li")).toBe(items()[0]);
    expect(screen.queryByText("Second")).toBeNull();
  });

  it("places items it cannot identify by type (a server component's children) in the list", async () => {
    const LazyItem = React.lazy(async () => ({ default: StepperItem }));
    render(
      <React.Suspense fallback={null}>
        <Stepper aria-label="Lazy">
          {["One", "Two"].map((title, index) => (
            <LazyItem key={title} step={index}>
              <StepperTrigger>
                <StepperTitle>{title}</StepperTitle>
              </StepperTrigger>
            </LazyItem>
          ))}
          <StepperContent step={0}>First panel</StepperContent>
        </Stepper>
      </React.Suspense>,
    );
    const one = await screen.findByText("One");
    const list = screen.getByRole("list", { name: "Lazy" });
    expect(list.contains(one)).toBe(true);
    expect(items()).toHaveLength(2);
    expect(trigger(/One/).textContent).toMatch(/^Step 1 of 2: /);
    expect(list.contains(screen.getByText("First panel"))).toBe(false);
  });

  it("labels override every screen-reader word", () => {
    render(
      <Example
        defaultValue={1}
        errorAt={2}
        labels={{
          step: (n, total) => `Étape ${n} sur ${total}`,
          completed: "fait",
          error: "erreur",
        }}
      />,
    );
    expect(trigger(/Cart/).textContent).toMatch(/^Étape 1 sur 4: .*, fait$/);
    expect(trigger(/Payment/).textContent).toMatch(/, erreur$/);
  });
});
