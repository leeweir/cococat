import { test, expect } from "@playwright/test";
import { freshState, SAVE_KEY } from "../../src/state.js";
test("owned treasures render on the home shelf, persist, enforce three and can be removed", async ({
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
        collection: ["leaf", "bell", "stone", "shell"],
      },
    },
  );
  await page.goto("/");
  await page.locator("[data-tab=house]").click();
  await page.locator("[data-action=collection]").click();
  await expect(page.locator("[data-display=key]")).toBeDisabled();
  for (const id of ["leaf", "bell", "stone"])
    await page.locator(`[data-display=${id}]`).click();
  await page.locator("[data-display=shell]").click();
  await expect(page.locator("#toast")).toContainText("最多放三件");
  expect(
    await page.evaluate(
      () => window.__miaow.inspect().world.displayedTreasures,
    ),
  ).toEqual(["leaf", "bell", "stone"]);
  await page.locator("#album-done").click();
  await page.screenshot({
    path: `/tmp/cococat-treasures-${test.info().project.name}.png`,
  });
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-mode", "home");
  expect(
    await page.evaluate(
      () => window.__miaow.inspect().world.displayedTreasures,
    ),
  ).toEqual(["leaf", "bell", "stone"]);
  await page.locator("[data-tab=house]").click();
  await page.locator("[data-action=collection]").click();
  await page.locator("[data-display=bell]").click();
  expect(
    await page.evaluate(
      () => window.__miaow.inspect().world.displayedTreasures,
    ),
  ).toEqual(["leaf", "stone"]);
  expect(errors).toEqual([]);
});
