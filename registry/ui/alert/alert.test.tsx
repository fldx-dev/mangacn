import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import AlertDefaultDemo from "./demos/default";

afterEach(cleanup);

describe("Alert", () => {
  it("renders role=alert with data-slots and a forwarded className", () => {
    render(
      <Alert className="custom-class">
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Body</AlertDescription>
        <AlertAction>Undo</AlertAction>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("data-slot")).toBe("alert");
    expect(alert.classList.contains("custom-class")).toBe(true);
    expect(screen.getByText("Title").getAttribute("data-slot")).toBe("alert-title");
    expect(screen.getByText("Body").getAttribute("data-slot")).toBe("alert-description");
    expect(screen.getByText("Undo").getAttribute("data-slot")).toBe("alert-action");
  });

  it("draws a paper InkFrame instead of a CSS border", () => {
    render(<Alert>Note</Alert>);
    const alert = screen.getByRole("alert");
    for (const name of alert.classList) {
      expect(name, name).not.toMatch(/^border$|^border-(?!0)|^shadow-/);
    }
    const frame = alert.querySelector(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-fill")).toBe("paper");
  });

  it("inks the destructive outline and title in spot, the description in ink", () => {
    render(<Alert variant="destructive">Failed</Alert>);
    const classes = screen.getByRole("alert").classList;
    for (const name of [
      "*:data-[slot=ink-frame]:[--ink:var(--destructive)]",
      "text-destructive",
      "*:data-[slot=alert-description]:text-foreground",
    ]) {
      expect(classes.contains(name), name).toBe(true);
    }
    expect(classes.contains("*:data-[slot=alert-description]:text-destructive/90")).toBe(false);
    cleanup();
    render(<Alert>Note</Alert>);
    expect(screen.getByRole("alert").className).not.toContain("--ink:");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<AlertDefaultDemo />);
  });
});
