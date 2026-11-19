import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { settings } from "./components/settings-data";
import { SettingsForm, validateSettings } from "./components/settings-form";
import Page from "./page";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");
const status = () => screen.getByRole("status");

describe("settings-01 page", () => {
  it("is one main with one h1, a section nav and four sections named by their headings", () => {
    render(<Page />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Settings",
    ]);
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Account",
      "Notifications",
      "Reading",
      "Danger zone",
    ]);
    for (const link of links) {
      const heading = document.getElementById(link.getAttribute("href")?.slice(1) ?? "");
      expect(heading?.tagName).toBe("H2");
      expect(heading?.textContent).toBe(link.textContent);
      expect(screen.getByRole("region", { name: link.textContent ?? "" })).toBeTruthy();
    }
  });

  it("moves focus to a section's heading from its nav link", () => {
    render(<Page />);
    const link = screen.getByRole("link", { name: "Reading" });
    fireEvent.click(link);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Reading" }));
  });

  it("shows the demo data", () => {
    render(<Page />);
    expect(screen.getByLabelText(/Display name/)).toHaveProperty("value", "Aiko Tanaka");
    expect(screen.getByLabelText("Email")).toHaveProperty("value", "aiko@example.com");
    expect(screen.getByLabelText("Language").textContent).toContain("English");
    expect(screen.getByLabelText("Time zone").textContent).toContain("Asia/Tokyo");
    expect(screen.getByRole("switch", { name: "New chapters" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByRole("switch", { name: "Weekly digest" }).getAttribute("aria-checked")).toBe(
      "false",
    );
    const direction = screen.getByRole("group", { name: "Reading direction" });
    expect(
      within(direction).getByRole("button", { name: "Right to left" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("names every input, so the form posts as a plain form", () => {
    render(<Page />);
    const form = screen.getByRole("form", { name: "Settings" });
    const names = new Set(
      Array.from(form.querySelectorAll("input")).map((input) => input.getAttribute("name")),
    );
    expect(names.has(null)).toBe(false);
    for (const name of [
      "displayName",
      "email",
      "language",
      "timeZone",
      "newChapters",
      "replies",
      "weeklyDigest",
      "emailFrequency",
      "readingDirection",
      "pageLayout",
      "contentWarnings",
    ]) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it("is a server page around a client form, importing it by install path once added", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/settings-form.tsx"))).toBe(true);
    expect(source("page.tsx")).toContain('from "./components/settings-form"');
    const installed = installedPageSource("settings-01");
    expect(installed).toContain('from "@/components/settings-form"');
    expect(installed).toContain('from "@/components/settings-data"');
  });

  it("reads no clock while rendering: the same markup at two dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 9));
    const first = renderToStaticMarkup(<Page />);
    vi.setSystemTime(new Date(2031, 6, 15, 23));
    expect(renderToStaticMarkup(<Page />)).toBe(first);
    for (const file of [
      "page.tsx",
      "components/settings-form.tsx",
      "components/settings-data.ts",
    ]) {
      expect(source(file), file).not.toMatch(/new Date\(\)|Date\.now|Math\.random|randomUUID/);
    }
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("SettingsForm", () => {
  it("refuses an empty display name: the error shows and the field takes focus", async () => {
    const onSave = vi.fn();
    render(<SettingsForm defaultValues={settings} onSave={onSave} />);
    const name = screen.getByLabelText(/Display name/);
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(document.activeElement).toBe(name);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const error = document.getElementById(name.getAttribute("aria-describedby") ?? "");
    expect(error?.textContent).toContain("Enter a display name.");
    expect(onSave).not.toHaveBeenCalled();
    expect(status().textContent).toBe("");
  });

  it("refuses a malformed email after a valid name, focusing the email", async () => {
    render(<SettingsForm defaultValues={settings} />);
    const email = screen.getByLabelText("Email");
    fireEvent.change(email, { target: { value: "" } });
    fireEvent.change(email, { target: { value: "aiko@" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(document.activeElement).toBe(email);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("name@example.com");
  });

  it("saves valid settings by Enter in a text field and announces it politely", async () => {
    const onSave = vi.fn();
    render(<SettingsForm defaultValues={settings} onSave={onSave} />);
    const name = screen.getByLabelText(/Display name/);
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.change(name, { target: { value: "Aiko T." } });
    // Enter in a text field submits the form (the browser's implicit submission; e2e walks it).
    fireEvent.submit((name as HTMLInputElement).form as HTMLFormElement);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ displayName: "Aiko T." }));
    expect(status().textContent).toBe("Settings saved");
    expect(name.getAttribute("aria-invalid")).toBeNull();
  });

  it("resets to the saved data and clears the errors", async () => {
    render(<SettingsForm defaultValues={settings} />);
    const name = screen.getByLabelText(/Display name/);
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.click(screen.getByRole("switch", { name: "Weekly digest" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(name).toHaveProperty("value", "Aiko Tanaka");
    expect(name.getAttribute("aria-invalid")).toBeNull();
    expect(screen.getByRole("switch", { name: "Weekly digest" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("keeps one reading direction pressed", async () => {
    render(<SettingsForm defaultValues={settings} />);
    const rtl = screen.getByRole("button", { name: "Right to left" });
    const ltr = screen.getByRole("button", { name: "Left to right" });
    fireEvent.click(ltr);
    expect(ltr.getAttribute("aria-pressed")).toBe("true");
    expect(rtl.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(ltr);
    expect(ltr.getAttribute("aria-pressed")).toBe("true");
  });

  it("asks before deleting: confirm closes the dialog and announces the request", async () => {
    const onDeleteAccount = vi.fn();
    render(<SettingsForm defaultValues={settings} onDeleteAccount={onDeleteAccount} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete your account?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onDeleteAccount).toHaveBeenCalledTimes(1);
    expect(status().textContent).toBe("Account deletion requested");
  });

  it("closes the dialog on Escape and returns focus to the delete button", async () => {
    render(<SettingsForm defaultValues={settings} />);
    const trigger = screen.getByRole("button", { name: "Delete account" });
    fireEvent.click(trigger);
    await screen.findByRole("alertdialog");
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(status().textContent).toBe("");
  });

  it("validates the display name and the email's shape only", () => {
    expect(validateSettings(settings)).toEqual({});
    expect(validateSettings({ ...settings, displayName: "  " })).toHaveProperty("displayName");
    expect(validateSettings({ ...settings, email: "" })).toEqual({});
    expect(validateSettings({ ...settings, email: "a@b" })).toHaveProperty("email");
  });

  it("uses spot only for errors and the delete action", () => {
    for (const file of ["page.tsx", "components/settings-form.tsx"]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border-|text-spot|bg-spot|gradient/);
    }
    const destructive = source("components/settings-form.tsx").match(/variant="destructive"/g);
    expect(destructive).toHaveLength(2);
  });

  it("announces the same result twice when saved twice", async () => {
    render(<SettingsForm defaultValues={settings} />);
    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.click(save);
    const first = status().firstElementChild;
    fireEvent.click(save);
    expect(status().firstElementChild).not.toBe(first);
    expect(status().textContent).toBe("Settings saved");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
