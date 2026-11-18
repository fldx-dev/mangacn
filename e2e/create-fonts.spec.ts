import { expect, type Page, test } from "@playwright/test";
import { registryItemSchema } from "shadcn/schema";
import { encode } from "../lib/create/code";
import { type CreateConfig, DEFAULT_CONFIG } from "../lib/create/config";
import { DIALOGUE_FACES, DISPLAY_FACES } from "../lib/create/fonts";
import { VITE_FONT_SANS } from "../lib/create/items";
import { waitForInk } from "./ready";

// The Create page's fonts (Task C7): the font routes, the faces the preview draws (Latin and
// Japanese), a face switch with no fallback frame once the face has loaded, and no alternative
// face downloaded by a phone that never opens the choices. No pixels: create.spec.ts shoots the page.

const ALTERNATIVES: CreateConfig = {
  ...DEFAULT_CONFIG,
  fonts: { display: "reggae-one", dialogue: "patrick-hand-sc" },
};
const CODES = { default: encode(DEFAULT_CONFIG), alternatives: encode(ALTERNATIVES) } as const;

/** The specimen's display text (a sound effect), dialogue text and Japanese display text. */
const NODES = {
  display: 'section[aria-label="sfx-text"] [data-slot="sfx-text"]',
  dialogue: 'section[aria-label="speech-bubble"] [data-slot="speech-bubble"]',
  japanese: 'section[aria-label="badge"] [lang="ja"]',
} as const;

/**
 * The web face an element's text is drawn in: the first family of its computed stack with loaded
 * faces whose `unicode-range` covers every character, as the browser picks one; "fallback" when
 * none does (the text is in a fallback or system face). A face the browser has drawn with is
 * loaded, so this also says whether a frame showed a fallback.
 */
async function drawnFace(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const text = [...(element.textContent ?? "").replace(/\s+/g, "")];
      const families = getComputedStyle(element)
        .fontFamily.split(",")
        .map((family) => family.trim().replace(/^["']|["']$/g, ""));
      const covers = (face: FontFace, point: number) =>
        face.unicodeRange.split(",").some((range) => {
          const [from, to = from] = range.trim().replace(/^U\+/i, "").split("-");
          const low = Number.parseInt(from.replaceAll("?", "0"), 16);
          const high = Number.parseInt(to.replaceAll("?", "F"), 16);
          return point >= low && point <= high;
        });
      for (const family of families) {
        const faces = [...document.fonts].filter(
          (face) => face.family.replace(/^["']|["']$/g, "") === family && face.status === "loaded",
        );
        if (
          faces.length > 0 &&
          text.every((char) => faces.some((face) => covers(face, char.codePointAt(0) ?? 0)))
        ) {
          return family;
        }
      }
      return "fallback";
    });
}

async function open(page: Page, code: string) {
  const response = await page.goto(`/create?c=${code}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-slot="create-preview-surface"]')).toBeVisible();
  await waitForInk(page);
}

test.describe("the font routes", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "w1280", "one width is enough");
  });

  test("every curated face is a schema-valid registry:font with its Fontsource package", async ({
    request,
  }) => {
    for (const [role, faces] of [
      ["display", DISPLAY_FACES],
      ["dialogue", DIALOGUE_FACES],
    ] as const) {
      for (const [id, face] of Object.entries(faces)) {
        const response = await request.get(`/r/create/font/${role}/${id}.json`);
        expect(response.status(), `${role}/${id}`).toBe(200);
        expect(response.headers()["access-control-allow-origin"]).toBe("*");
        const item = await response.json();
        expect(registryItemSchema.safeParse(item).success).toBe(true);
        expect(item.type).toBe("registry:font");
        expect(item.font.family).toBe(face.family);
        expect(item.font.dependency).toBe(face.dependency);
      }
    }
  });

  test("an unknown role or face is 404 with a message that does not repeat the request", async ({
    request,
  }) => {
    for (const path of [
      "display/comic-sans.json",
      "dialogue/reggae-one.json",
      "sans/geist.json",
      "display/reggae-one",
      "__proto__/reggae-one.json",
      "display/%3Cscript%3E.json",
    ]) {
      const response = await request.get(`/r/create/font/${path}`);
      expect(response.status(), path).toBe(404);
      expect(response.headers()["cache-control"]).toBe("no-store");
      const body = await response.json();
      expect(Object.keys(body)).toEqual(["message"]);
      expect(body.message).toBe(
        "This is not a Create font. Choose one at https://www.mangacn.com/create.",
      );
    }
  });

  test("a code's theme names its faces' items, and the Vite bundle brings a body font", async ({
    request,
  }) => {
    const theme = await (await request.get(`/r/create/${CODES.alternatives}/theme.json`)).json();
    expect(theme.registryDependencies).toEqual([
      "https://www.mangacn.com/r/create/font/display/reggae-one.json",
      "https://www.mangacn.com/r/create/font/dialogue/patrick-hand-sc.json",
      "https://www.mangacn.com/r/font-dialogue-ja.json",
    ]);
    const vite = await request.get(`/r/create/${CODES.alternatives}/vite.json`);
    expect(vite.status()).toBe(200);
    const bundle = await vite.json();
    expect(bundle.type).toBe("registry:base");
    expect(bundle.cssVars.theme["font-sans"]).toBe(VITE_FONT_SANS);
    expect(registryItemSchema.safeParse(bundle).success).toBe(true);
  });
});

test.describe("the faces the preview draws", () => {
  test("a code with both alternatives draws them, and Japanese still has a face", async ({
    page,
  }) => {
    await open(page, CODES.alternatives);
    await expect.poll(() => drawnFace(page, NODES.display)).toBe("Reggae One");
    await expect.poll(() => drawnFace(page, NODES.dialogue)).toBe("Patrick Hand SC");
    // 完結 in the display face: Reggae One brings its own kana and kanji.
    await expect.poll(() => drawnFace(page, NODES.japanese)).toBe("Reggae One");
  });

  test("the default code draws the default faces", async ({ page }) => {
    await open(page, CODES.default);
    await expect.poll(() => drawnFace(page, NODES.display)).toBe("Dela Gothic One");
    await expect.poll(() => drawnFace(page, NODES.dialogue)).toBe("Shantell Sans");
    await expect.poll(() => drawnFace(page, NODES.japanese)).toBe("Dela Gothic One");
  });

  test("once a face has loaded, switching to it draws it in the next frame", async ({ page }) => {
    test.skip(test.info().project.name !== "w1280", "the rail is on screen from 1024 px");
    await open(page, CODES.alternatives);
    await expect.poll(() => drawnFace(page, NODES.display)).toBe("Reggae One");
    // Back to the default, then to the loaded alternative: neither frame draws a fallback.
    const rail = page.getByRole("complementary", { name: "Choices" });
    const display = rail.getByRole("radiogroup", { name: /Display/ });
    for (const [name, family] of [
      [/Dela Gothic One/, "Dela Gothic One"],
      [/Reggae One/, "Reggae One"],
    ] as const) {
      await display.getByRole("radio", { name }).click();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      expect(await drawnFace(page, NODES.display)).toBe(family);
    }
  });

  test("the pickers set each name in its own face", async ({ page }) => {
    test.skip(test.info().project.name !== "w1280", "the rail is on screen from 1024 px");
    await open(page, CODES.default);
    for (const [font, family] of [
      ["dela-gothic-one", "Dela Gothic One"],
      ["reggae-one", "Reggae One"],
      ["shantell-sans", "Shantell Sans"],
      ["patrick-hand-sc", "Patrick Hand SC"],
    ]) {
      const selector = `[data-slot="create-rail"] [data-slot="create-font-name"][data-font="${font}"]`;
      await expect.poll(() => drawnFace(page, selector)).toBe(family);
    }
  });
});

test.describe("on a phone", () => {
  test("the default code downloads no alternative face until the choices open", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "w360", "the phone width");
    await open(page, CODES.default);
    /** The status of every @font-face of a next/font family, by the variable that names it. */
    const statuses = (variable: string) =>
      page.evaluate((name) => {
        const probe = document.querySelector<HTMLElement>('[data-slot="create-preview-surface"]');
        const value = probe ? getComputedStyle(probe).getPropertyValue(name) : "";
        const family = value
          .split(",")[0]
          ?.trim()
          .replace(/^['"]|['"]$/g, "");
        return [...document.fonts].filter((face) => face.family === family).map((f) => f.status);
      }, variable);
    for (const variable of ["--font-create-reggae-one", "--font-create-patrick-hand-sc"]) {
      const found = await statuses(variable);
      expect(found.length, `${variable} declares its faces`).toBeGreaterThan(0);
      expect(
        found.every((status) => status === "unloaded"),
        `${variable}: ${found}`,
      ).toBe(true);
    }
    // Opening the choices shows the names in their faces, which loads them.
    await page.getByRole("button", { name: /Choices/ }).click();
    await expect
      .poll(async () => (await statuses("--font-create-reggae-one")).includes("loaded"))
      .toBe(true);
  });
});
