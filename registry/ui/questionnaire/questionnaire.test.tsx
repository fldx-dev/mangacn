import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "./questionnaire";

beforeAll(() => {
  stubResizeObserver();
});

afterEach(cleanup);

function Survey({ onSubmit }: { onSubmit?: (data: FormData) => void }) {
  return (
    <Questionnaire
      className="custom-class"
      defaultItem="series"
      shortcuts="letters"
      aria-label="Survey"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(new FormData(event.currentTarget));
      }}
    >
      <QuestionnaireProgress />
      <QuestionnaireItem name="series" required>
        <QuestionnaireTitle>Which series?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="rooftop">
            Rooftop
            <QuestionnaireChoiceDescription>Action</QuestionnaireChoiceDescription>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="tea">Tea</QuestionnaireChoice>
          <QuestionnaireChoice value="bell">Bell</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="format" multiple>
        <QuestionnaireTitle>Where?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="print">Print</QuestionnaireChoice>
          <QuestionnaireChoice value="phone">Phone</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireInput aria-label="Somewhere else" />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const frames = (element: Element | null) =>
  Array.from(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []);
const choiceOf = (radio: HTMLElement) =>
  radio.closest<HTMLElement>("[data-slot=questionnaire-choice]");

describe("Questionnaire", () => {
  it("keeps stock's slots and forwards className", () => {
    render(<Survey />);
    expect(slot("questionnaire")?.tagName).toBe("FORM");
    expect(slot("questionnaire")?.classList.contains("custom-class")).toBe(true);
    for (const name of [
      "questionnaire-progress",
      "questionnaire-item",
      "questionnaire-title",
      "questionnaire-choices",
      "questionnaire-choice",
      "questionnaire-choice-input",
      "questionnaire-choice-indicator",
      "questionnaire-choice-label",
      "questionnaire-choice-shortcut",
      "questionnaire-choice-description",
      "questionnaire-error",
      "questionnaire-actions",
      "questionnaire-previous",
      "questionnaire-skip",
      "questionnaire-next",
      "questionnaire-submit",
    ]) {
      expect(slot(name), name).not.toBeNull();
    }
  });

  it("draws progress's inked track under stock's progress text", () => {
    render(<Survey />);
    const progress = screen.getByRole("progressbar");
    expect(progress.textContent).toContain("Question 1 of 2");
    expect(progress.getAttribute("aria-valuenow")).toBe("1");
    const track = progress.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(frames(track)[0]?.dataset.fill).toBe("paper");
    const indicator = track?.querySelector<HTMLElement>(".bg-primary");
    expect(indicator?.style.width).toBe("50%");
  });

  it("draws each choice as an outlined paper row that turns ink once chosen", () => {
    render(<Survey />);
    const radio = screen.getByRole("radio", { name: /Rooftop/ });
    const row = choiceOf(radio);
    const [paper, ink] = frames(row);
    expect(paper?.dataset.fill).toBe("paper");
    expect(paper?.className).toContain("group-data-checked/questionnaire-choice:hidden");
    expect(ink?.dataset.fill).toBe("ink");
    expect(ink?.className).toContain("hidden group-data-checked/questionnaire-choice:block");
    expect(row?.className).toContain("data-checked:text-primary-foreground");
    expect(row?.className).not.toMatch(/(^| )border( |-input|-primary)/);
    fireEvent.click(radio);
    expect(row?.hasAttribute("data-checked")).toBe(true);
    // The description stays readable on the ink row.
    expect(slot("questionnaire-choice-description")?.className).toContain(
      "group-data-checked/questionnaire-choice:text-primary-foreground",
    );
  });

  it("renders Previous, Skip, Next and Submit as mangacn's buttons", () => {
    render(<Survey />);
    for (const [name, variant, fill] of [
      ["questionnaire-previous", "outline", "paper"],
      ["questionnaire-skip", "outline", "paper"],
      ["questionnaire-next", "default", "ink"],
      ["questionnaire-submit", "default", "ink"],
    ] as const) {
      const button = slot(name);
      expect(button?.tagName, name).toBe("BUTTON");
      expect(button?.dataset.variant, name).toBe(variant);
      expect(frames(button)[0]?.dataset.fill, name).toBe(fill);
    }
  });

  it("shows the error in spot when going on without an answer", () => {
    render(<Survey />);
    const error = slot("questionnaire-error");
    expect(error?.hidden).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(error?.hidden).toBe(false);
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.className).toContain("text-destructive");
    expect(choiceOf(screen.getByRole("radio", { name: /Rooftop/ }))?.className).toContain(
      "data-invalid:[--ink:var(--destructive)]",
    );
  });

  describe("keyboard (stock's)", () => {
    // Between two radios the browser's own radio-group arrows apply (stock leaves them alone);
    // stock moves focus into the answers, between checkboxes and on to the text field.
    it("moves into and between answers with the arrow keys", () => {
      render(<Survey />);
      const [series] = screen.getAllByRole("group");
      act(() => series?.focus());
      fireEvent.keyDown(series as HTMLElement, { key: "ArrowDown" });
      const rooftop = screen.getByRole("radio", { name: /Rooftop/ }) as HTMLInputElement;
      expect(document.activeElement).toBe(rooftop);
      expect(rooftop.checked).toBe(true);
      expect(choiceOf(rooftop)?.hasAttribute("data-checked")).toBe(true);

      fireEvent.keyDown(rooftop, { key: "Enter" });
      const print = screen.getByRole("checkbox", { name: "Print" });
      const phone = screen.getByRole("checkbox", { name: "Phone" });
      act(() => print.focus());
      fireEvent.keyDown(print, { key: "ArrowDown" });
      expect(document.activeElement).toBe(phone);
      fireEvent.keyDown(phone, { key: "ArrowDown" });
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Somewhere else" }));
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
      expect(document.activeElement).toBe(phone);
      expect((phone as HTMLInputElement).checked).toBe(false);
    });

    it("chooses by letter shortcut and shows the key on each row", () => {
      render(<Survey />);
      const shortcuts = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="questionnaire-choice-shortcut"]'),
      ).slice(0, 3);
      // The key cap holds kbd's paper frame; its letter is the slot's own data-shortcut, drawn
      // by CSS (a render function there re-rendered stock's subtree observer into a loop).
      expect(shortcuts.map((key) => key.dataset.shortcut)).toEqual(["A", "B", "C"]);
      expect(shortcuts[0]?.className).toContain("after:content-[attr(data-shortcut)]");
      expect(shortcuts[0]?.getAttribute("aria-hidden")).toBe("true");
      expect(frames(shortcuts[0] ?? null)[0]?.dataset.fill).toBe("paper");
      fireEvent.keyDown(slot("questionnaire") as HTMLElement, { key: "c" });
      expect((screen.getByRole("radio", { name: "Bell" }) as HTMLInputElement).checked).toBe(true);
    });

    it("goes on with Enter once answered, back with ArrowLeft, and submits from the last", () => {
      const onSubmit = vi.fn();
      render(<Survey onSubmit={onSubmit} />);
      const tea = screen.getByRole("radio", { name: "Tea" });
      fireEvent.click(tea);
      act(() => tea.focus());
      fireEvent.keyDown(tea, { key: "Enter" });
      expect(screen.getByRole("progressbar").textContent).toContain("Question 2 of 2");
      const print = screen.getByRole("checkbox", { name: "Print" });
      expect(print.closest("fieldset")?.hidden).toBe(false);
      fireEvent.keyDown(print, { key: "ArrowLeft" });
      expect(screen.getByRole("progressbar").textContent).toContain("Question 1 of 2");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "Phone" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      const data = onSubmit.mock.calls[0]?.[0] as FormData;
      expect(data.get("series")).toBe("tea");
      expect(data.getAll("format")).toEqual(["phone"]);
    });
  });

  it("outlines the free-text field and turns it spot when invalid", () => {
    render(<Survey />);
    const wrapper = slot("questionnaire-input-wrapper");
    expect(frames(wrapper)[0]?.dataset.fill).toBe("paper");
    expect(wrapper?.className).toContain("has-aria-invalid:[--ink:var(--destructive)]");
    expect(slot("questionnaire-input")?.className).toContain("border-0");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
