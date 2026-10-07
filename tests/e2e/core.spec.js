import { test as base, expect } from "@playwright/test";
import { freshState, SAVE_KEY } from "../../src/state.js";
import {
  BACKUP_KEY,
  RECOVERY_KEY,
  exportGame,
} from "../../src/save-manager.js";

// Playwright owns ephemeral browser contexts. No persistent profile or player's save is opened.
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(errors, "browser JavaScript errors").toEqual([]);
  },
});
const inspect = (page) => page.evaluate(() => window.__miaow.inspect());
async function seed(
  page,
  raw = JSON.stringify({ ...freshState(), adopted: true, name: "测试团子" }),
) {
  await page.addInitScript(
    ({ key, raw }) => {
      if (!sessionStorage.getItem("e2e-seeded")) {
        localStorage.setItem(key, raw);
        sessionStorage.setItem("e2e-seeded", "yes");
      }
    },
    { key: SAVE_KEY, raw },
  );
  await page.goto("/");
  await expect(page.locator("#loading")).toHaveCount(0);
}
const importFile = (page, content) =>
  page.locator("#save-file").setInputFiles({
    name: "save.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });

test("adoption, successful meal, outfit and reload retain progress without overflow", { tag: "@smoke" }, async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".cat-option.ready").first()).toBeVisible();
  await page.locator("#cat-name").fill("测试团子");
  await page.locator("#adopt-form button[type=submit]").click();
  await expect(page.locator("#app")).toHaveAttribute("data-mode", "home");
  const before = (await inspect(page)).state;
  await page.locator("[data-action=feed]").click();
  await page.locator("#serve").click();
  await expect(page.locator("#serve")).toHaveText("再做一碗");
  expect((await inspect(page)).state.fullness).toBeGreaterThan(before.fullness);
  await page.locator("#home").click();
  await page.locator("[data-action=wardrobe]").click();
  await page.locator("[data-item]").first().click();
  const outfit = (await inspect(page)).state.outfit;
  expect(Object.keys(outfit).length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator("#scene-title")).toContainText("测试团子");
  expect((await inspect(page)).state.outfit).toEqual(outfit);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("storage failures stay visible and successful saving clears the warning", async ({
  page,
}) => {
  await seed(page);
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    SAVE_KEY,
  );
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException("Isolated test quota", "QuotaExceededError");
    };
  });
  await page.locator("[data-action=wardrobe]").click();
  await page.locator("[data-item]").first().click();
  await expect(page.locator("#save-warning")).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe(saved);
  await page.locator("#save-help").click();
  await expect(page.locator("#settings")).toBeVisible();
  await page.locator("#settings-done").click();
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalSetItem;
  });
  await page.locator("[data-item]").first().click();
  await expect(page.locator("#save-warning")).toBeHidden();
});

test("export/import requires confirmation, rejects invalid files and backs up the old pet", async ({
  page,
}) => {
  await seed(page);
  await page.locator("#settings-open").click();
  const pendingDownload = page.waitForEvent("download");
  await page.locator("#export-save").click();
  const stream = await (await pendingDownload).createReadStream(),
    chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString()).state.name).toBe(
    "测试团子",
  );
  for (const raw of [
    "{broken",
    JSON.stringify({ version: 99, adopted: true }),
  ]) {
    await importFile(page, raw);
    await expect(page.locator("#toast")).toContainText(
      /不是有效的 JSON|无法识别/,
    );
    expect((await inspect(page)).state.name).toBe("测试团子");
  }
  const raw = exportGame({ ...freshState(), adopted: true, name: "新朋友" });
  await importFile(page, raw);
  await expect(page.locator("#import-confirm")).toBeVisible();
  await page.locator("#import-cancel").click();
  expect((await inspect(page)).state.name).toBe("测试团子");
  await page.locator("#settings-open").click();
  await importFile(page, raw);
  await page.locator("#import-confirm-button").click();
  await expect(page.locator("#scene-title")).toContainText("新朋友");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).name,
      BACKUP_KEY,
    ),
  ).toBe("测试团子");
  await page.locator("#settings-open").click();
  await page.locator("#restore-save").click();
  await expect(page.locator("#scene-title")).toContainText("测试团子");
});

test("corrupt saves are never silently overwritten, including after reload", async ({
  page,
}) => {
  await seed(page, "{broken");
  await expect(page.locator("#save-warning")).toBeVisible();
  await page.locator("#adopt-form button[type=submit]").click();
  await expect(page.locator("#settings")).toBeVisible();
  await page.reload();
  await expect(page.locator("#save-warning")).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe("{broken");
  await page.locator("#save-help").click();
  await page.locator("#restart-open").click();
  await page.locator("#restart-confirm-button").click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY),
  ).toBe("{broken");
  await expect(page.locator("#save-warning")).toBeHidden();
});
