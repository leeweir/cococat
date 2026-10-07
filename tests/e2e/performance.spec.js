import { test, expect } from "@playwright/test";
import { BREEDS, freshState, SAVE_KEY } from "../../src/state.js";
const world = (page) => page.evaluate(() => window.__miaow.inspect().world);
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, state }) => {
      if (!sessionStorage.getItem("seed")) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem("seed", "1");
      }
    },
    { key: SAVE_KEY, state: { ...freshState(), adopted: true } },
  );
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-mode", "home");
});
test("adopted startup is lazy, all destinations still open and quality persists", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  expect((await world(page)).thumbnailShots).toBe(0);
  expect((await world(page)).environments.sort()).toEqual(["adopt", "home"]);
  await page.locator("#settings-open").click();
  await page.locator("#quality").selectOption("low");
  await page.locator("#settings-done").click();
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-mode", "home");
  expect((await world(page)).quality).toBe("low");
  for (const action of ["bath", "wardrobe", "tv"]) {
    await page.locator(`[data-action=${action}]`).click();
    await expect(page.locator("#home")).toBeVisible();
    await page.locator("#home").click();
  }
  for (const region of ["park", "garden", "street"]) {
    await page.locator("[data-action=explore]").click();
    await page.locator(`[data-region=${region}]`).click();
    expect((await world(page)).scene).toBe(region);
    await page.locator("#home").click();
  }
  expect((await world(page)).environments.sort()).toEqual([
    "adopt",
    "bath",
    "garden",
    "home",
    "park",
    "street",
    "wardrobe",
  ]);
  expect(errors).toEqual([]);
});
test("dialogs/background stop redundant draws and resume without a time jump", async ({
  page,
}) => {
  await page.locator("#settings-open").click();
  // Wait for the single requested final frame, rather than assuming software GL finishes in 100 ms.
  await expect.poll(async () => (await world(page)).pendingRender).toBe(false);
  const a = await world(page);
  await page.waitForTimeout(400);
  const b = await world(page);
  expect(b.renderFrames).toBe(a.renderFrames);
  expect(b.elapsed).toBe(a.elapsed);
  await page.locator("#settings-done").click();
  await expect
    .poll(async () => (await world(page)).renderFrames)
    .toBeGreaterThan(b.renderFrames);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await world(page);
  await page.waitForTimeout(400);
  expect((await world(page)).renderFrames).toBe(hidden.renderFrames);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(async () => (await world(page)).renderFrames)
    .toBeGreaterThan(hidden.renderFrames);
  expect((await world(page)).elapsed - hidden.elapsed).toBeLessThan(0.3);
});
test("placement bursts coalesce and scene exit flushes the latest furniture", async ({
  page,
}) => {
  await page.locator("[data-tab=house]").click();
  await page.locator("[data-action=decorate]").click();
  await page.evaluate(() => {
    window.saveWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "miaow-cottage-v1") window.saveWrites++;
      return original.call(this, k, v);
    };
    for (let i = 0; i < 12; i++)
      document.querySelector("#furniture-rotate").click();
    document.querySelector("#furniture-done").click();
  });
  const result = await page.evaluate(
    (key) => ({
      writes: window.saveWrites,
      saved: JSON.parse(localStorage.getItem(key)).furniture,
      live: window.__miaow.inspect().state.furniture,
    }),
    SAVE_KEY,
  );
  expect(result.writes).toBe(1);
  expect(result.saved).toEqual(result.live);
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-mode", "home");
  expect(
    await page.evaluate(() => window.__miaow.inspect().state.furniture),
  ).toEqual(result.live);
});

test("returning to adoption creates thumbnails once and reused cards stay ready", async ({
  page,
}) => {
  async function restart() {
    await page.locator("#settings-open").click();
    await page.locator("#restart-open").click();
    await page.locator("#restart-confirm-button").click();
  }
  await restart();
  await expect(page.locator(".cat-option.ready")).toHaveCount(BREEDS.length);
  expect((await world(page)).thumbnailShots).toBe(BREEDS.length);
  await page.locator("#adopt-form button[type=submit]").click();
  await restart();
  await expect(page.locator(".cat-option.ready")).toHaveCount(BREEDS.length);
  expect((await world(page)).thumbnailShots).toBe(BREEDS.length);
});
