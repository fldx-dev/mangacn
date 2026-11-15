import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { decode } from "../lib/create/code";
import { createCommands } from "../lib/create/commands";
import { AXE_DISABLED_RULES } from "../lib/test/axe-rules";
import { waitForInk } from "./ready";

// Get code (Task C6): the dialog prints commands.ts's lines for the page's code, works by
// keyboard and at 360 px, passes axe in both modes, copies and says so; a hostile `?c=` reaches
// neither the dialog nor `/create.md`; `/create.md`, `llms.txt` and the docs point to Create.
// No screenshots: nothing here owes a baseline.

/** The three codes C3's smoke installs: the default, a preset with a kit, a custom look. */
const CODES = ["10", "1H11", "1J4blt1gX22"];

function commandsFor(code: string, manager: "pnpm" | "npm" = "pnpm") {
  const result = decode(code);
  if (!result.ok) throw new Error(result.reason);
  return createCommands(result.config, manager);
}

async function open(page: Page, code: string, mode: "light" | "dark" = "light") {
  await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
  const response = await page.goto(`/create?c=${encodeURIComponent(code)}`);
  expect(response?.status()).toBe(200);
  await waitForInk(page);
}

/** The Get code button: in the rail on a desktop, in the Choices drawer below it. */
async function getCodeButton(page: Page): Promise<Locator> {
  const rail = page.getByRole("complementary", { name: "Choices" });
  if (await rail.isVisible()) return rail.getByRole("button", { name: "Get code" });
  await page.getByRole("button", { name: /^Choices/ }).click();
  return page.getByRole("dialog", { name: "Choices" }).getByRole("button", { name: "Get code" });
}

async function openDialog(page: Page): Promise<Locator> {
  await (await getCodeButton(page)).click();
  const dialog = page.getByRole("dialog", { name: "Get code" });
  await expect(dialog).toBeVisible();
  return dialog;
}

const slot = (dialog: Locator, name: string) => dialog.locator(`[data-slot="${name}"]`);

for (const code of CODES) {
  test(`code ${code}: the dialog's commands are commands.ts's, character for character`, async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "w1280", "one width is enough for the strings");
    await open(page, code);
    const dialog = await openDialog(page);
    const pnpm = commandsFor(code);
    await expect(slot(dialog, "create-dialog-code")).toHaveText(code);
    await expect(slot(dialog, "create-command-new")).toHaveText(pnpm.nextProject);
    await dialog.getByRole("button", { name: "Vite" }).click();
    await expect(slot(dialog, "create-command-new")).toHaveText(pnpm.viteProject);
    await dialog.getByRole("tab", { name: "npm" }).click();
    await expect(slot(dialog, "create-command-new")).toHaveText(
      commandsFor(code, "npm").viteProject,
    );
    await dialog.getByRole("tab", { name: "Existing project" }).click();
    await expect(slot(dialog, "create-command-existing")).toHaveText(
      commandsFor(code, "npm").existingProject,
    );
    await expect(slot(dialog, "create-command-look")).toHaveText(commandsFor(code, "npm").lookOnly);
  });
}

test("the dialog works by keyboard and fits the screen", async ({ page }) => {
  await open(page, "1H11");
  const button = await getCodeButton(page);
  await button.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Get code" });
  await expect(dialog).toBeVisible();

  // Tab into the section tabs and move with the arrows.
  const newTab = dialog.getByRole("tab", { name: "New project" });
  for (let i = 0; i < 6 && !(await newTab.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(newTab).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: "Existing project" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(slot(dialog, "create-command-existing")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(slot(dialog, "create-files")).toContainText("components/ui/button.tsx");

  // Inside the viewport, nothing wider than the dialog.
  const viewport = page.viewportSize();
  const box = await dialog.boundingBox();
  expect(box && viewport && box.x >= 0 && box.x + box.width <= viewport.width).toBe(true);
  const overflow = await dialog.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow, "no horizontal scroll in the dialog").toBeLessThanOrEqual(0);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("copy puts the command on the clipboard and says so", async ({ page, context }) => {
  test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "1J4blt1gX22");
  const dialog = await openDialog(page);
  await dialog.getByRole("button", { name: "Copy new Next.js project command" }).click();
  await expect(slot(dialog, "create-copy-command-status")).toHaveText(
    "New Next.js project command copied",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    commandsFor("1J4blt1gX22").nextProject,
  );
});

for (const mode of ["light", "dark"] as const) {
  test(`axe finds nothing with the dialog open (${mode})`, async ({ page }) => {
    test.skip(test.info().project.name === "w768", "a phone and a desktop width are enough");
    await open(page, "1H11", mode);
    const dialog = await openDialog(page);
    for (const tab of ["New project", "Existing project", "What you get", "For an agent"]) {
      await dialog.getByRole("tab", { name: tab }).click();
      if (tab === "What you get") await expect(slot(dialog, "create-files")).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .disableRules(AXE_DISABLED_RULES)
        .exclude("[data-base-ui-focus-guard]")
        .analyze();
      expect(
        violations.map(({ id, nodes }) => ({ id, nodes: nodes.map((n) => n.target.join(" ")) })),
        `axe on ${tab}`,
      ).toEqual([]);
    }
  });
}

test("a hostile code reaches neither the dialog nor /create.md", async ({ page, request }) => {
  test.skip(test.info().project.name !== "w1280", "one width is enough");
  const hostile = '10"><script>window.__pwned=1</script>;rm -rf ~';
  await open(page, hostile);
  const dialog = await openDialog(page);
  await expect(slot(dialog, "create-dialog-code")).toHaveText("10");
  for (const tab of ["New project", "Existing project", "For an agent"]) {
    await dialog.getByRole("tab", { name: tab }).click();
    const text = (await dialog.textContent()) ?? "";
    for (const fragment of ["script", "pwned", "rm -rf"]) expect(text).not.toContain(fragment);
  }
  expect(await page.evaluate(() => "__pwned" in window)).toBe(false);

  const markdown = await request.get(`/create.md?c=${encodeURIComponent(hostile)}`);
  expect(markdown.status()).toBe(200);
  const body = await markdown.text();
  expect(body).toContain("so this is the default configuration");
  for (const fragment of ["script", "pwned", "rm -rf"]) expect(body).not.toContain(fragment);
});

test("/create.md, llms.txt and the docs point to Create", async ({ request }) => {
  test.skip(test.info().project.name !== "w1280", "plain requests; one project is enough");
  const markdown = await request.get("/create.md?c=1H11");
  expect(markdown.status()).toBe(200);
  expect(markdown.headers()["content-type"]).toMatch(/^text\/markdown\b/);
  const text = await markdown.text();
  expect(text).toContain(`\`\`\`bash\n${commandsFor("1H11", "npm").nextProject}\n\`\`\``);

  expect(await (await request.get("/llms.txt")).text()).toContain(
    "https://www.mangacn.com/create.md?c=<code>",
  );
  for (const docs of ["/docs/installation", "/docs/theming"]) {
    const html = await (await request.get(docs)).text();
    expect(html, `${docs} links to Create`).toMatch(/<a [^>]*href="\/create"/);
  }
});
