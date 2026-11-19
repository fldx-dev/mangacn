import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { PROFILE_BIO_MAX, profile } from "./components/profile-data";
import { ProfileForm, validatePassword, validateProfile } from "./components/profile-form";
import Page from "./page";

const createObjectURL = vi.fn((_: Blob) => "blob:preview");
const revokeObjectURL = vi.fn();

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");
const announcer = () => screen.getAllByRole("status").at(-1) as HTMLElement;

function pick(files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: files });
  fireEvent.change(input);
}

function fileOf(name: string, type: string, size: number) {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("profile-01 page", () => {
  it("is one main with one h1 and two sections, each a form named by its heading", () => {
    render(<Page />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Profile",
    ]);
    for (const name of ["Public profile", "Password"]) {
      const region = screen.getByRole("region", { name });
      expect(within(region).getByRole("form", { name })).toBeTruthy();
    }
  });

  it("shows the demo data, initials in the avatar", () => {
    render(<Page />);
    expect(screen.getByLabelText(/Display name/)).toHaveProperty("value", "Aiko Tanaka");
    expect(screen.getByLabelText(/Username/)).toHaveProperty("value", "aiko_reads");
    expect(screen.getByText("AT")).toBeTruthy();
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).value.split("\n")).toHaveLength(2);
    const interests = document.querySelectorAll('input[name="interests"]');
    expect(Array.from(interests, (input) => (input as HTMLInputElement).value)).toEqual([
      "seinen",
      "slice of life",
      "mystery",
    ]);
  });

  it("names every input, so each form posts as a plain form", () => {
    render(<Page />);
    for (const form of screen.getAllByRole("form")) {
      for (const input of form.querySelectorAll("input, textarea")) {
        // tags-input's text box is a draft; its tags post as hidden inputs named `interests`.
        if (input.getAttribute("data-slot") === "tags-input-input") continue;
        expect(input.getAttribute("name"), input.outerHTML).toBeTruthy();
      }
    }
  });

  it("is a server page around a client form, importing it by install path once added", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/profile-form.tsx"))).toBe(true);
    expect(source("page.tsx")).toContain('from "./components/profile-form"');
    const installed = installedPageSource("profile-01");
    expect(installed).toContain('from "@/components/profile-form"');
    expect(installed).toContain('from "@/components/profile-data"');
  });

  it("reads no clock while rendering: the same markup at two dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 9));
    const first = renderToStaticMarkup(<Page />);
    vi.setSystemTime(new Date(2031, 6, 15, 23));
    expect(renderToStaticMarkup(<Page />)).toBe(first);
    for (const file of ["page.tsx", "components/profile-form.tsx", "components/profile-data.ts"]) {
      expect(source(file), file).not.toMatch(/new Date\(\)|Date\.now|Math\.random|randomUUID/);
    }
  });

  it("draws nothing of its own", () => {
    for (const file of ["page.tsx", "components/profile-form.tsx"]) {
      expect(source(file), file).not.toMatch(/<svg|<img|shadow-|border-|text-spot|bg-spot/);
    }
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("ProfileForm: the photo", () => {
  it("has a Change photo trigger that opens the native dialog", () => {
    render(<ProfileForm defaultValues={profile} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute("accept")).toBe("image/*");
    expect(input.multiple).toBe(false);
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Change photo" }));
    expect(click).toHaveBeenCalled();
  });

  it("rejects a photo over 2 MB with its reason under the avatar", () => {
    render(<ProfileForm defaultValues={profile} />);
    pick([fileOf("poster.png", "image/png", 3 * 1024 * 1024)]);
    const trigger = screen.getByRole("button", { name: "Change photo" });
    const error = screen.getByText(/poster\.png is larger than 2 MB/);
    expect(trigger.getAttribute("aria-describedby")).toContain(error.closest("[id]")?.id);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects a file that is not an image", () => {
    render(<ProfileForm defaultValues={profile} />);
    pick([fileOf("notes.pdf", "application/pdf", 1000)]);
    expect(screen.getByText(/notes\.pdf is not an image/)).toBeTruthy();
  });

  it("previews a small image by object URL, revoking it on change and unmount", async () => {
    const { unmount } = render(<ProfileForm defaultValues={profile} />);
    pick([fileOf("big.png", "image/png", 3 * 1024 * 1024)]);
    pick([fileOf("me.png", "image/png", 50_000)]);
    expect(screen.queryByText(/is larger than/)).toBeNull();
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    pick([fileOf("me-2.png", "image/png", 60_000)]);
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(2));
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});

describe("ProfileForm: the public profile", () => {
  it("refuses an empty display name: the error shows and the field takes focus", () => {
    const onSaveProfile = vi.fn();
    render(<ProfileForm defaultValues={profile} onSaveProfile={onSaveProfile} />);
    const name = screen.getByLabelText(/Display name/);
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(document.activeElement).toBe(name);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(name.getAttribute("aria-describedby") ?? "")?.textContent,
    ).toContain("Enter a display name.");
    expect(onSaveProfile).not.toHaveBeenCalled();
  });

  it("saves a valid profile and announces it", () => {
    const onSaveProfile = vi.fn();
    render(<ProfileForm defaultValues={profile} onSaveProfile={onSaveProfile} />);
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "https://aiko.example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ website: "https://aiko.example.com" }),
      null,
    );
    expect(announcer().textContent).toBe("Profile saved");
  });

  it("describes the bio by its count and announces only at the limit", () => {
    render(<ProfileForm defaultValues={profile} />);
    const bio = screen.getByLabelText("Bio");
    const count = document.getElementById(bio.getAttribute("aria-describedby") ?? "");
    expect(count?.textContent).toBe(`${profile.bio.length} / ${PROFILE_BIO_MAX} characters`);
    expect(bio.getAttribute("maxlength")).toBe(String(PROFILE_BIO_MAX));
    const limit = count?.nextElementSibling as HTMLElement;
    expect(limit.getAttribute("role")).toBe("status");
    expect(limit.textContent).toBe("");
    fireEvent.change(bio, { target: { value: "a".repeat(PROFILE_BIO_MAX) } });
    expect(count?.textContent).toBe(`${PROFILE_BIO_MAX} / ${PROFILE_BIO_MAX} characters`);
    expect(limit.textContent).toContain("limit");
  });

  it("adds pasted interests split at commas", () => {
    render(<ProfileForm defaultValues={{ ...profile, interests: [] }} />);
    const field = screen.getByLabelText("Interests");
    fireEvent.paste(field, { clipboardData: { getData: () => "a, b" } });
    const tags = document.querySelectorAll('input[name="interests"]');
    expect(Array.from(tags, (input) => (input as HTMLInputElement).value)).toEqual(["a", "b"]);
  });

  it("validates the names and the website's shape", () => {
    expect(validateProfile(profile)).toEqual({});
    expect(validateProfile({ ...profile, username: "a b" })).toHaveProperty("username");
    expect(validateProfile({ ...profile, website: "aiko" })).toHaveProperty("website");
  });
});

describe("ProfileForm: the password", () => {
  const fill = (current: string, next: string, confirm: string) => {
    fireEvent.change(screen.getByLabelText(/Current password/), { target: { value: current } });
    fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: next } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), { target: { value: confirm } });
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
  };

  it("refuses a weak new password and focuses it", () => {
    const onSavePassword = vi.fn();
    render(<ProfileForm defaultValues={profile} onSavePassword={onSavePassword} />);
    fill("old-secret", "abc", "abc");
    const next = screen.getByLabelText(/^New password/);
    expect(document.activeElement).toBe(next);
    expect(next.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/Choose a stronger password/)).toBeTruthy();
    expect(onSavePassword).not.toHaveBeenCalled();
  });

  it("refuses a confirmation that differs", () => {
    render(<ProfileForm defaultValues={profile} />);
    fill("old-secret", "night-train-2026", "night-train-2025");
    const confirm = screen.getByLabelText(/Confirm new password/);
    expect(document.activeElement).toBe(confirm);
    expect(screen.getByText("The passwords do not match.")).toBeTruthy();
  });

  it("saves a strong, confirmed password, clears the fields and announces it", () => {
    const onSavePassword = vi.fn();
    render(<ProfileForm defaultValues={profile} onSavePassword={onSavePassword} />);
    fill("old-secret", "night-train-2026", "night-train-2026");
    expect(onSavePassword).toHaveBeenCalledWith({
      current: "old-secret",
      next: "night-train-2026",
    });
    expect(screen.getByLabelText(/^New password/)).toHaveProperty("value", "");
    expect(announcer().textContent).toBe("Password changed");
  });

  it("asks for strength 2 or more", () => {
    expect(validatePassword("x", "abcdefgh", "abcdefgh")).toHaveProperty("next");
    expect(validatePassword("x", "abcdefg1", "abcdefg1")).toEqual({});
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
