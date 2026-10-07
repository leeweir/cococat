import { test, expect } from "@playwright/test";
import { freshState, SAVE_KEY } from "../../src/state.js";
import { recordWish } from "../../src/daily-wishes.js";
test("optional wishes count successful care only, survive reload and reward once", async ({
  page,
}) => {
  let state = { ...freshState(), adopted: true };
  state = recordWish(recordWish(state, "play"), "explore");
  await page.addInitScript(
    ({ key, state }) => {
      if (!sessionStorage.getItem("seed")) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem("seed", "1");
      }
    },
    { key: SAVE_KEY, state },
  );
  await page.goto("/");
  await page.locator("[data-action=daily]").click();
  await expect(page.locator(".wish-row.done")).toHaveCount(2);
  await expect(page.locator("#wish-claim")).toBeDisabled();
  await page.locator("[data-wish=feed]").click();
  await page.locator("#serve").click();
  await page.locator("#home").click();
  await page.locator("[data-action=daily]").click();
  await expect(page.locator(".wish-row.done")).toHaveCount(2);
  await page.locator("[data-wish=feed]").click();
  await page.locator("#serve").click();
  await expect(page.locator("#serve")).toHaveText("再做一碗");
  await page.reload();
  await page.locator("[data-action=daily]").click();
  await expect(page.locator(".wish-row.done")).toHaveCount(3);
  const before = await page.evaluate(
    () => window.__miaow.inspect().state.hearts,
  );
  await page.locator("#wish-claim").click();
  expect(await page.evaluate(() => window.__miaow.inspect().state.hearts)).toBe(
    before + 3,
  );
  await expect(page.locator("#wish-claim")).toBeDisabled();
  await page.reload();
  await page.locator("[data-action=daily]").click();
  await expect(page.locator("#wish-claim")).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
