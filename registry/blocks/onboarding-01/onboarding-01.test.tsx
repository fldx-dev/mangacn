import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { axe, expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { onboardingDefaults, onboardingGenres } from "./components/onboarding-data";
import {
  OnboardingFlow,
  onboardingStepLabel,
  validateOnboardingStep,
} from "./components/onboarding-flow";
import Page from "./page";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");
const heading = () => screen.getByRole("heading", { level: 2 });
const next = () => fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)$/ }));

function fillProfile(name = "Aiko") {
  fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: name } });
}

function pickGenres(count: number) {
  for (const genre of onboardingGenres.slice(0, count)) {
    fireEvent.click(screen.getByRole("checkbox", { name: genre }));
  }
}

describe("onboarding data", () => {
  it("offers twelve genres and starts with the reminder off at 21:00", () => {
    expect(onboardingGenres).toHaveLength(12);
    expect(onboardingDefaults.reminder).toBe(false);
    expect(onboardingDefaults.reminderTime).toBe("21:00");
  });
});

describe("validateOnboardingStep", () => {
  it("needs a name, three genres, and a time when the reminder is on", () => {
    expect(validateOnboardingStep(0, { ...onboardingDefaults, name: "  " }).name).toBeTruthy();
    expect(validateOnboardingStep(0, { ...onboardingDefaults, name: "Aiko" })).toEqual({});
    expect(validateOnboardingStep(1, { ...onboardingDefaults, genres: ["A", "B"] }).genres).toBe(
      "Pick at least 3 genres.",
    );
    expect(validateOnboardingStep(1, { ...onboardingDefaults, genres: ["A", "B", "C"] })).toEqual(
      {},
    );
    const habits = { ...onboardingDefaults, reminder: true, reminderTime: null };
    expect(validateOnboardingStep(2, habits).reminderTime).toBeTruthy();
    expect(validateOnboardingStep(2, { ...habits, reminder: false })).toEqual({});
  });

  it("labels a step as it is announced", () => {
    expect(onboardingStepLabel(1)).toBe("Step 2 of 4, Interests");
  });
});

describe("OnboardingFlow", () => {
  it("keeps the step on Next with an empty name, shows the error and focuses the field", () => {
    render(<OnboardingFlow />);
    next();
    expect(heading().textContent).toBe("Profile");
    const name = screen.getByRole("textbox", { name: /Name/ });
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("Enter your name.");
    expect(document.activeElement).toBe(name);
  });

  it("goes Next on Enter in the name field, focuses the new heading and announces the step", () => {
    render(<OnboardingFlow />);
    fillProfile();
    fireEvent.submit(screen.getByRole("textbox", { name: /Name/ }).closest("form") as HTMLElement);
    expect(heading().textContent).toBe("Interests");
    expect(document.activeElement).toBe(heading());
    expect(screen.getByRole("status").textContent).toBe("Step 2 of 4, Interests");
  });

  it("asks for three genres, focusing the first checkbox", () => {
    render(<OnboardingFlow />);
    fillProfile();
    next();
    pickGenres(2);
    next();
    expect(heading().textContent).toBe("Interests");
    expect(screen.getByRole("alert").textContent).toContain("Pick at least 3 genres.");
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "Action" }));
    pickGenres(3);
    // Unticking the first two and ticking three: Action and Adventure off, Comedy on.
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);
    fireEvent.click(screen.getByRole("checkbox", { name: "Drama" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Fantasy" }));
    next();
    expect(heading().textContent).toBe("Habits");
  });

  it("keeps the answers on Back", () => {
    render(<OnboardingFlow />);
    fillProfile("Ren");
    fireEvent.click(screen.getByRole("radio", { name: "On a tablet" }));
    next();
    pickGenres(3);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(heading().textContent).toBe("Profile");
    expect(document.activeElement).toBe(heading());
    expect((screen.getByRole("textbox", { name: /Name/ }) as HTMLInputElement).value).toBe("Ren");
    expect(screen.getByRole("radio", { name: "On a tablet" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    next();
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(3);
  });

  it("walks to Done: Finish on Habits, a summary, a link to the library, and onComplete", () => {
    const onComplete = vi.fn();
    render(<OnboardingFlow onComplete={onComplete} libraryHref="/shelf" />);
    fillProfile();
    next();
    pickGenres(3);
    next();
    expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: /Daily reminder/ }));
    fireEvent.click(screen.getByRole("button", { name: "Left to right" }));
    next();
    expect(heading().textContent).toBe("Done");
    expect(screen.getByRole("status").textContent).toBe("Step 4 of 4, Done");
    expect(screen.getByText("On, at 21:00")).toBeTruthy();
    expect(screen.getByText("Action, Adventure, Comedy")).toBeTruthy();
    expect(screen.getByText("Left to right")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to library" }).getAttribute("href")).toBe("/shelf");
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Aiko", reminder: true, direction: "ltr" }),
    );
  });

  it("lets the stepper revisit completed steps and validates a step forward", () => {
    render(<OnboardingFlow />);
    // The next step is choosable (linear), but the current one must be valid first.
    fireEvent.click(screen.getByRole("button", { name: /Step 2 of 4:\s*Interests$/ }));
    expect(heading().textContent).toBe("Profile");
    fillProfile();
    next();
    pickGenres(3);
    next();
    fireEvent.click(screen.getByRole("button", { name: /Step 1 of 4:\s*Profile,\s*completed/ }));
    expect(heading().textContent).toBe("Profile");
    // Habits was reached but not completed: from Profile it is two steps away, so text.
    expect(screen.queryByRole("button", { name: /Step 3 of 4/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Step 2 of 4:\s*Interests,\s*completed/ }));
    expect(heading().textContent).toBe("Interests");
  });

  it("names every input and posts the choices like a plain form", () => {
    const { container } = render(<OnboardingFlow />);
    expect(container.querySelector("input[name='name']")).toBeTruthy();
    expect(container.querySelector("form")?.getAttribute("aria-labelledby")).toBe(heading().id);
  });
});

describe("Page", () => {
  it("has one h1 and one main", () => {
    render(<Page />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  const markup = (html: string) => html.replace(/_r_[0-9a-z]+_/g, "_r_");

  it("reads no clock in render: the same markup on two different days", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0));
    const first = markup(render(<Page />).container.innerHTML);
    cleanup();
    vi.setSystemTime(new Date(2031, 6, 15, 23, 30));
    const second = markup(render(<Page />).container.innerHTML);
    expect(second).toBe(first);
  });

  it("passes axe", async () => {
    await act(async () => {
      await expectNoA11yViolations(<Page />);
    });
  });

  it("passes axe on every step, errors shown", async () => {
    const { baseElement } = render(<Page />);
    next();
    expect(await axe(baseElement)).toHaveNoViolations();
    fillProfile();
    next();
    next();
    expect(await axe(baseElement)).toHaveNoViolations();
    pickGenres(3);
    next();
    fireEvent.click(screen.getByRole("switch", { name: /Daily reminder/ }));
    expect(await axe(baseElement)).toHaveNoViolations();
    next();
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

describe("onboarding-01 files", () => {
  it("keeps the page a server component; the flow holds state", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/onboarding-flow.tsx"))).toBe(true);
  });

  it("reads no clock and no randomness", () => {
    for (const file of [
      "page.tsx",
      "components/onboarding-flow.tsx",
      "components/onboarding-data.ts",
    ]) {
      expect(source(file)).not.toMatch(/Date\.now|new Date\(\)|Math\.random|randomUUID/);
    }
  });
});

describe("demos", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
