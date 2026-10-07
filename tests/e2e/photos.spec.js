import { test, expect } from "@playwright/test";
import { freshState, SAVE_KEY } from "../../src/state.js";
test("photos capture name/date/outfit, decode, persist, validate import and delete safely", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    ({ key, state }) => {
      if (!sessionStorage.getItem("seed")) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem("seed", "1");
      }
    },
    {
      key: SAVE_KEY,
      state: {
        ...freshState(),
        adopted: true,
        name: "相册团子",
        outfit: { head: "beanie" },
        memories: ["旧的相遇还在。"],
      },
    },
  );
  await page.goto("/");
  await page.locator("[data-tab=house]").click();
  await page.locator("[data-action=album]").click();
  await page.locator("#photo-add").click();
  await expect(page.locator(".photo-card")).toHaveCount(1);
  await page.locator(".photo-card img").evaluate((img) => img.decode());
  await expect(page.locator(".photo-card")).toContainText("相册团子");
  await expect(page.locator(".photo-card time")).not.toBeEmpty();
  await page.screenshot({
    path: `/tmp/cococat-album-${test.info().project.name}.png`,
  });
  const saved = await page.evaluate(
    () => window.__miaow.inspect().state.photos[0],
  );
  expect(saved.outfit).toEqual({ head: "beanie" });
  expect(saved.image.length).toBeLessThanOrEqual(140000);
  await page.reload();
  await page.locator("[data-tab=house]").click();
  await page.locator("[data-action=album]").click();
  expect(
    await page.evaluate(() => window.__miaow.inspect().state.photos[0]),
  ).toEqual(saved);
  await expect(page.locator("#memory-list")).toContainText("旧的相遇还在");
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page.locator("#photo-add").click();
  await expect(page.locator("#photo-note")).toContainText("尚未保存");
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalSetItem;
  });
  await page.locator("[data-delete-photo]").first().click();
  await expect(page.locator(".photo-card")).toHaveCount(1);
  await page.locator("[data-delete-photo]").click();
  await expect(page.locator(".photo-card")).toHaveCount(0);
  await page.reload();
  expect(
    await page.evaluate(() => window.__miaow.inspect().state.photos),
  ).toEqual([]);
  expect(errors).toEqual([]);
});
