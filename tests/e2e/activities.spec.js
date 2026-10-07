import { test, expect } from "@playwright/test";
import { freshState, SAVE_KEY } from "../../src/state.js";

test("completed bath, TV, hide-and-seek and real treasure arrival update daily wishes", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: SAVE_KEY, state: { ...freshState(), adopted: true } },
  );
  await page.goto("/");
  await page.locator("[data-action=bath]").click();
  await page.evaluate(() => {
    for (let i = 0; i < 9; i++) document.querySelector("#bath-work").click();
  });
  await page.locator("#bath-next").click();
  await page.evaluate(() => {
    for (let i = 0; i < 9; i++) document.querySelector("#bath-work").click();
  });
  await expect(page.locator("#action-status")).toContainText("香香完成");
  await page.locator("#home").click();
  await page.locator("[data-action=tv]").click();
  await page.locator('[data-channel="1"]').click();
  await page.locator("#watch").click();
  await expect(page.locator("#action-status")).toContainText("陪伴完成");
  await page.locator("#home").click();
  await page.locator("[data-tab=play]").click();
  await page.locator("[data-action=hide]").click();
  for (let round = 0; round < 2; round++) {
    await page.locator("#listen").click();
    const hint = await page.locator("#bubble").textContent();
    const index = ["左边", "中间", "右边"].findIndex((s) => hint.includes(s));
    expect(index).toBeGreaterThanOrEqual(0);
    await page.locator(`[data-box="${index}"]`).click();
    if (round === 0) await page.locator("#next-hide").click();
  }
  await page.locator("#toy-home").click();
  await page.locator("[data-tab=care]").click();
  await page.locator("[data-action=explore]").click();
  await page.locator("[data-region=park]").click();
  await page.locator("#explore-hint").click();
  await expect(page.locator("#explore-count")).toContainText("1 / 3", {
    timeout: 45000,
  });
  await page.locator("#home").click();
  await page.locator("[data-action=daily]").click();
  await expect(page.locator(".wish-row.done")).toHaveCount(3);
  await page.screenshot({
    path: `/tmp/cococat-wishes-${test.info().project.name}.png`,
  });
  expect(errors).toEqual([]);
});
