import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Group C's browser-only checks (SPEC-components-9 §8), one describe per lane. The
// catalog-driven checks (axe in both modes, no overflow at every width, the shots) are
// e2e/demos.spec.ts's.

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));
const skipUnless = (item: string) =>
  test.skip(only !== undefined && !only.includes(item), "E2E_ITEMS leaves it out");

async function openDemo(page: Page, item: string, demo: string) {
  const response = await page.goto(`/demo/${item}/${demo}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

test.describe("phone-input", () => {
  test.skip(only !== undefined && !only.includes("phone-input"), "E2E_ITEMS leaves it out");

  const phone = (page: Page) => page.getByRole("textbox", { name: "Phone" });
  const country = (page: Page) => page.locator('[data-slot="phone-input-country"]');

  test("a pasted +81 3-1234-5678 picks Japan and reads the national way", async ({
    page,
    context,
  }) => {
    // The system clipboard is one per browser: one width, so no two tests write it at once.
    test.skip(test.info().project.name !== "w1280", "one width is enough");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openDemo(page, "phone-input", "countries");
    const input = page.getByRole("textbox", { name: "Studio phone" });
    await input.fill("");
    await expect(country(page)).toHaveAccessibleName("Country: France, FR +33");
    await page.evaluate(() => navigator.clipboard.writeText("+81 3-1234-5678"));
    await input.focus();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(country(page)).toHaveAccessibleName("Country: Japan, JP +81");
    await expect(input).toHaveValue("03-1234-5678");
  });

  test("picking another country from the keyboard keeps the digits", async ({ page }) => {
    await openDemo(page, "phone-input", "default");
    await phone(page).pressSequentially("0312345678");
    await expect(phone(page)).toHaveValue("03-1234-5678");
    await country(page).focus();
    await page.keyboard.press("Enter");
    const searchBox = page.getByRole("combobox", { name: "Search countries" });
    await expect(searchBox).toBeFocused();
    // Escape closes the list and hands focus back to the trigger.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(country(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(searchBox).toBeFocused();
    await searchBox.pressSequentially("+82");
    await expect(page.getByRole("option")).toHaveText(["KR South Korea +82"]);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(country(page)).toHaveAccessibleName(/^Country: South Korea, KR/);
    await expect(country(page)).toBeFocused();
    // The same digits, formatted the Korean way.
    await expect(phone(page)).toHaveValue("031-234-5678");
    await expect(phone(page)).toHaveAccessibleDescription(/South Korea, \+82/);
  });

  test("an edit inside the number keeps the caret after the same digit", async ({ page }) => {
    await openDemo(page, "phone-input", "default");
    const input = phone(page);
    await input.pressSequentially("0312345678");
    await input.press("Home");
    for (let i = 0; i < 3; i++) await input.press("ArrowRight");
    // Backspace right after "03-" takes the 3, not the hyphen; the caret stays after the 0.
    await input.press("Backspace");
    await expect(input).not.toHaveValue("03-1234-5678");
    expect(
      await input.evaluate((element: HTMLInputElement) => element.value.replace(/\D/g, "")),
    ).toBe("012345678");
    expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(1);
    await input.press("3");
    await expect(input).toHaveValue("03-1234-5678");
    expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(2);
  });

  test("an incomplete number is invalid only after blur", async ({ page }) => {
    await openDemo(page, "phone-input", "default");
    await phone(page).pressSequentially("0312");
    await expect(phone(page)).toHaveValue("03-12");
    await expect(phone(page)).not.toHaveAttribute("aria-invalid");
    await page.keyboard.press("Tab");
    await expect(phone(page)).toHaveAttribute("aria-invalid", "true");
    // Typing again clears it until the next blur.
    await phone(page).press("End");
    await phone(page).pressSequentially("345678");
    await expect(phone(page)).not.toHaveAttribute("aria-invalid");
    await page.keyboard.press("Tab");
    await expect(phone(page)).not.toHaveAttribute("aria-invalid");
  });

  test("the form posts the number in E.164", async ({ page }) => {
    await openDemo(page, "phone-input", "form");
    const input = page.getByRole("textbox", { name: "Phone for delivery" });
    const save = page.getByRole("button", { name: "Save" });
    await save.click();
    await expect(page.locator('[data-slot="field-error"]')).toHaveText("Enter a phone number.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await input.pressSequentially("090-1234-5678");
    await expect(input).toHaveValue("090-1234-5678");
    await save.click();
    await expect(page.getByRole("status")).toHaveText("Sent +819012345678.");
    expect(
      await page.evaluate(() => [...new FormData(document.querySelector("form") ?? undefined)]),
    ).toEqual([["phone", "+819012345678"]]);
  });

  test("at 360 the trigger shows the ISO code alone, the list opens as wide as the field and nothing overflows", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "w360", "the phone width");
    for (const demo of ["default", "countries", "form"]) {
      await openDemo(page, "phone-input", demo);
      await expect(country(page)).toHaveText(/^[A-Z]{2}$/, { useInnerText: true });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, demo).toBeLessThanOrEqual(0);
    }
    await openDemo(page, "phone-input", "default");
    await country(page).click();
    const popup = page.locator('[data-slot="combobox-content"]');
    await expect(popup).toBeVisible();
    const field = await page
      .locator('[data-slot="phone-input"] [data-slot="input-group"]')
      .first()
      .boundingBox();
    const list = await popup.boundingBox();
    expect(Math.abs((list?.width ?? 0) - (field?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(list?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(360);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("data-table", () => {
  test.skip(only !== undefined && !only.includes("data-table"), "E2E_ITEMS leaves it out");

  const status = (page: Page) => page.locator('[data-slot="data-table-status"]');
  const firstCells = (page: Page) => page.locator("tbody tr td:first-child");

  test("sorts, filters and pages, announcing each", async ({ page }) => {
    test.skip(test.info().project.name !== "w1280", "desktop flow");
    await openDemo(page, "data-table", "default");

    await page.getByRole("button", { name: "Pages", exact: true }).click();
    await page.getByRole("menuitem", { name: "Descending" }).click();
    await expect(page.getByRole("columnheader", { name: /Pages/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await expect(status(page)).toHaveText("Sorted by Pages, descending");
    await expect(firstCells(page).first()).toHaveText("1");

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(status(page)).toHaveText("Page 2 of 3");
    await expect(page.locator('[data-slot="data-table-pagination"]')).toContainText("Page 2 of 3");

    // Typing filters and goes back to the first page; the count is what is said.
    await page.getByRole("searchbox", { name: "Filter by Title" }).fill("the");
    await expect(status(page)).toHaveText("4 of 12 rows");
    await expect(firstCells(page)).toHaveText(["1", "12", "8", "4"]);
    await expect(page.locator('[data-slot="data-table-pagination"]')).toContainText("Page 1 of 1");
  });

  test("select-all goes from mixed to all and back, announcing the count", async ({ page }) => {
    test.skip(test.info().project.name !== "w1280", "desktop flow");
    await openDemo(page, "data-table", "selection");
    const all = page.getByRole("checkbox", { name: "Select all rows on this page" });

    await page.getByRole("checkbox", { name: "Select page 2" }).click();
    await expect(status(page)).toHaveText("1 selected");
    await expect(all).toHaveAttribute("aria-checked", "mixed");

    await all.click();
    await expect(all).toHaveAttribute("aria-checked", "true");
    await expect(status(page)).toHaveText("5 selected");
    await expect(page.locator('tbody tr[data-state="selected"]')).toHaveCount(5);

    await all.click();
    await expect(status(page)).toHaveText("No rows selected");
    await expect(page.locator('tbody tr[data-state="selected"]')).toHaveCount(0);
  });

  test("at 360 the table scrolls in its frame with the first column pinned", async ({ page }) => {
    test.skip(test.info().project.name !== "w360", "phone layout");
    await openDemo(page, "data-table", "default");
    const region = page.getByRole("region", { name: "Series chapters" });
    const { scroll, client } = await region.evaluate((element) => ({
      scroll: element.scrollWidth,
      client: element.clientWidth,
    }));
    expect(scroll).toBeGreaterThan(client);

    const first = page.locator("tbody tr").first().locator("td").nth(0);
    const second = page.locator("tbody tr").first().locator("td").nth(1);
    const before = { first: await first.boundingBox(), second: await second.boundingBox() };
    await region.evaluate((element) => {
      element.scrollLeft = 120;
    });
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const after = { first: await first.boundingBox(), second: await second.boundingBox() };
    expect(Math.abs((after.first?.x ?? 0) - (before.first?.x ?? 0))).toBeLessThan(1);
    expect(after.second?.x ?? 0).toBeLessThan((before.second?.x ?? 0) - 10);

    // Nothing reaches past the page: the toolbar and the pagination wrap.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()?.width ?? 0,
    );
  });
});

test.describe("kanban", () => {
  skipUnless("kanban");

  const live = (page: Page) => page.locator('[id^="DndLiveRegion"]');
  const body = (page: Page, text: string) =>
    page.locator('[data-slot="kanban-card-body"]', { hasText: text });
  const cards = (page: Page, column: string) =>
    page
      .locator('[data-slot="kanban-column"]', {
        has: page.locator('[data-slot="kanban-column-title"]', { hasText: column }),
      })
      .locator('[data-slot="kanban-card-body"]');

  test("a keyboard move across columns, announced at each step", async ({ page }) => {
    await openDemo(page, "kanban", "default");
    await body(page, "Rooftop chase").focus();
    await page.keyboard.press("Space");
    await expect(live(page)).toHaveText(
      "Picked up Rooftop chase. Column Pencils, position 1 of 2.",
    );
    await page.keyboard.press("ArrowRight");
    await expect(live(page)).toHaveText("Moved to column Inks, position 1 of 3.");
    await page.keyboard.press("ArrowDown");
    await expect(live(page)).toHaveText("Moved to column Inks, position 2 of 3.");
    // The carried card keeps the focus while it changes column.
    await expect(body(page, "Rooftop chase")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(live(page)).toHaveText("Dropped Rooftop chase in column Inks, position 2 of 3.");
    await expect(cards(page, "Inks")).toHaveText([/Cold open/, /Rooftop chase/, /Dojo flashback/]);
    await expect(cards(page, "Pencils")).toHaveText([/Night station/]);
    await expect(body(page, "Rooftop chase")).toBeFocused();
  });

  test("Escape cancels and puts the card back", async ({ page }) => {
    await openDemo(page, "kanban", "default");
    await body(page, "Rooftop chase").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await expect(cards(page, "Inks")).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(live(page)).toHaveText(
      "Cancelled. Rooftop chase returned to column Pencils, position 1 of 2.",
    );
    await expect(cards(page, "Pencils")).toHaveText([/Rooftop chase/, /Night station/]);
    await expect(cards(page, "Inks")).toHaveCount(2);
  });

  test("a pointer drag moves a card to another column", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w1280", "one pointer drag, at desktop width");
    await openDemo(page, "kanban", "default");
    const from = await body(page, "Rooftop chase").boundingBox();
    const to = await cards(page, "Tones").first().boundingBox();
    if (!from || !to) throw new Error("no boxes");
    await page.mouse.move(from.x + 20, from.y + 10);
    await page.mouse.down();
    // Past the 6 px activation distance, then over the target in steps.
    await page.mouse.move(from.x + 30, from.y + 10, { steps: 3 });
    await page.mouse.move(to.x + 20, to.y + 5, { steps: 15 });
    await expect(page.locator('[data-slot="kanban-overlay"]')).toBeVisible();
    await expect(page.locator('[data-slot="kanban-card"][data-dragging]')).toHaveCount(1);
    await page.mouse.up();
    await expect(cards(page, "Tones")).toHaveText([/Rooftop chase/, /Title spread/]);
    await expect(cards(page, "Pencils")).toHaveText([/Night station/]);
  });

  test("dragging near the row's edge scrolls it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w768", "a row wider than the screen");
    await openDemo(page, "kanban", "default");
    const board = page.locator('[data-slot="kanban-board"]');
    const edge = await board.boundingBox();
    const from = await body(page, "Epilogue").boundingBox();
    if (!edge || !from) throw new Error("no boxes");
    expect(await board.evaluate((element) => element.scrollLeft)).toBe(0);
    await page.mouse.move(from.x + 20, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(from.x + 30, from.y + 10, { steps: 3 });
    await page.mouse.move(edge.x + edge.width - 12, from.y + 10, { steps: 10 });
    await expect.poll(() => board.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
    await page.mouse.up();
    // The card lands in a column, wherever the row stopped.
    await expect(page.locator('[data-slot="kanban-card"][data-dragging]')).toHaveCount(0);
    await expect(cards(page, "Script")).toHaveCount(0);
    await expect(body(page, "Epilogue")).toHaveCount(1);
  });

  test("the row snaps column by column, one column wide at 360", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w360", "the phone layout");
    await openDemo(page, "kanban", "default");
    const board = page.locator('[data-slot="kanban-board"]');
    const layout = await board.evaluate((element) => {
      const row = getComputedStyle(element);
      const column = element.querySelector('[data-slot="kanban-column"]') as HTMLElement;
      const padding = Number.parseFloat(row.paddingLeft) + Number.parseFloat(row.paddingRight);
      return {
        snap: row.scrollSnapType,
        align: getComputedStyle(column).scrollSnapAlign,
        column: column.getBoundingClientRect().width,
        inner: element.clientWidth - padding,
        scrolls: element.scrollWidth > element.clientWidth,
        page: document.documentElement.scrollWidth <= window.innerWidth,
      };
    });
    expect(layout.snap).toBe("x mandatory");
    expect(layout.align).toBe("start");
    expect(Math.abs(layout.column - layout.inner)).toBeLessThan(1);
    expect(layout.scrolls).toBe(true);
    expect(layout.page).toBe(true);
    // A scroll part-way settles on the next column's start.
    await board.evaluate((element) => element.scrollBy({ left: 200, behavior: "instant" }));
    await expect
      .poll(() =>
        board.evaluate((element) => {
          const second = element.querySelectorAll('[data-slot="kanban-column"]')[1] as HTMLElement;
          return Math.round(
            second.getBoundingClientRect().left - element.getBoundingClientRect().left,
          );
        }),
      )
      .toBe(8);
  });

  test.describe("tilt", () => {
    test.use({ reducedMotion: "no-preference" });

    test("the carried card tilts", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "w1280", "one width");
      await openDemo(page, "kanban", "default");
      await body(page, "Rooftop chase").focus();
      await page.keyboard.press("Space");
      const face = page.locator('[data-slot="kanban-overlay-face"]');
      await expect(face).toBeVisible();
      expect(await face.evaluate((element) => getComputedStyle(element).rotate)).toBe("2deg");
      await page.keyboard.press("Escape");
    });
  });

  test("reduced motion: the carried card does not tilt", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w1280", "one width");
    // The suite runs with prefers-reduced-motion: reduce.
    await openDemo(page, "kanban", "default");
    await body(page, "Rooftop chase").focus();
    await page.keyboard.press("Space");
    const face = page.locator('[data-slot="kanban-overlay-face"]');
    await expect(face).toBeVisible();
    expect(await face.evaluate((element) => getComputedStyle(element).rotate)).toMatch(
      /^(none|0deg)$/,
    );
    // Nor does it glide from place to place: dnd-kit's 250 ms keyboard transition is off.
    await page.keyboard.press("ArrowRight");
    const glide = await page.locator('[data-slot="kanban-overlay"]').evaluate((element) => {
      const style = getComputedStyle(element.parentElement as HTMLElement);
      return style.transitionProperty === "none" || /^0s(, 0s)*$/.test(style.transitionDuration);
    });
    expect(glide).toBe(true);
    await page.keyboard.press("Escape");
  });
});

test.describe("rich-text-editor", () => {
  test.skip(only !== undefined && !only.includes("rich-text-editor"), "E2E_ITEMS leaves it out");

  const frame = '[data-slot="rich-text-editor"]';

  /** The demo with tiptap mounted: the region is contenteditable. */
  async function openEditor(page: Page, demo: string) {
    const response = await page.goto(`/demo/rich-text-editor/${demo}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
    await expect(page.locator(".ProseMirror[contenteditable]")).toBeVisible();
    await waitForInk(page);
  }

  test("types, bolds with Mod-B, makes a list from the toolbar and posts the HTML", async ({
    page,
  }) => {
    await openEditor(page, "form");
    const editor = page.getByRole("textbox", { name: "Chapter summary" });
    const bold = page.getByRole("button", { name: "Bold" });

    // Sending it empty shows the required error on the region.
    await page.getByRole("button", { name: "Send to the editor" }).click();
    await expect(page.getByText("Write a summary before you send it.")).toBeVisible();
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(editor).toHaveAttribute("aria-describedby", /rich-text-editor-summary-error/);

    await editor.click();
    await page.keyboard.type("Rain on the ");
    await page.keyboard.press("ControlOrMeta+b");
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.type("rooftop");
    await expect(page.getByText("19 / 280 characters")).toBeVisible();
    await expect(editor).not.toHaveAttribute("aria-invalid", "true");

    await page.getByRole("button", { name: "Bullet list" }).click();
    await expect(page.getByRole("button", { name: "Bullet list" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The pointer kept the selection in the editor: typing goes on in the list item.
    await page.keyboard.type("!");

    const html = "<ul><li><p>Rain on the <strong>rooftop!</strong></p></li></ul>";
    const posted = await page
      .locator("form")
      .evaluate((form: HTMLFormElement) => new FormData(form).get("summary"));
    expect(posted).toBe(html);
    await page.getByRole("button", { name: "Send to the editor" }).click();
    await expect(page.getByRole("status")).toHaveText(`Sent ${html.length} characters of HTML.`);

    // Tab leaves the editor (the unit test covers a second list item, which Tab could indent).
    await editor.click();
    await page.keyboard.press("Tab");
    await expect(editor).not.toBeFocused();
    expect(
      await page
        .locator("form")
        .evaluate((form: HTMLFormElement) => new FormData(form).get("summary")),
    ).toBe(html);
  });

  test("the toolbar is one tab stop with roving arrows", async ({ page }) => {
    await openEditor(page, "default");
    await page.getByRole("button", { name: "Bold" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Italic" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("textbox", { name: "Author's note" })).toBeFocused();
  });

  test("keeps its box on hydrate: the server's HTML and the mounted editor are one size", async ({
    page,
  }) => {
    // The docs page prerenders its demos (the stage renders on the client). Its scripts wait
    // until the server's HTML is measured. Hydrating that HTML logs nothing.
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    let release = () => {};
    const scripts = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      (url) => url.pathname.startsWith("/_next/static/") && url.pathname.endsWith(".js"),
      async (route) => {
        await scripts;
        await route.continue();
      },
    );
    await page.goto("/docs/components/rich-text-editor", { waitUntil: "commit" });
    await page.waitForFunction(
      () =>
        document.readyState !== "loading" &&
        document.querySelector('template[id^="B:"], div[hidden][id^="S:"]') === null,
    );
    await page.evaluate(() => document.fonts.ready);
    const boxes = () =>
      page
        .locator(frame)
        .evaluateAll((frames) => frames.map((element) => element.getBoundingClientRect().toJSON()));
    const before = await boxes();
    // The three demos, server-rendered as static HTML: no editable region yet.
    expect(before).toHaveLength(3);
    await expect(page.locator(".ProseMirror[contenteditable]")).toHaveCount(0);

    release();
    await expect(page.locator(".ProseMirror[contenteditable]")).toHaveCount(3);
    await waitForInk(page);
    const after = await boxes();
    for (const [index, box] of after.entries()) {
      expect(box.height, `demo ${index} height`).toBeCloseTo(before[index].height, 0);
      expect(box.width, `demo ${index} width`).toBeCloseTo(before[index].width, 0);
    }
    expect(errors).toEqual([]);
  });
});
