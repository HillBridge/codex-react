import { expect, test } from "@playwright/test";

test("global styles load on standalone login", async ({ page }) => {
  await page.goto("/dev-login");

  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--color-primary")
          .trim(),
      ),
    )
    .toBe("#1677ff");
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).minWidth))
    .toBe("280px");
});

test("merchant admin can search, open, and update an order", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "以管理员身份进入演示" }).click();
  await expect(page.getByRole("heading", { name: "东区旗舰店" })).toBeVisible();
  await page.getByRole("link", { name: "订单管理" }).click();
  await expect(page.getByRole("grid", { name: "订单列表" })).toBeVisible();
  await page.getByRole("textbox", { name: /搜索订单/ }).fill("1001");
  await page.getByRole("button", { name: "查询" }).click();
  await expect(page.getByText("OD202610120001")).toBeVisible();
  await expect(page.getByText("OD202610120002")).toHaveCount(0);
  await page
    .getByRole("row", { name: /OD202610120001/ })
    .getByRole("link", { name: "查看详情" })
    .click();
  await page.getByRole("button", { name: "确认订单" }).click();
  await expect(page.getByText("confirmed")).toBeVisible();
});

test("read-only role cannot see order mutation controls", async ({ page }) => {
  await page.goto("/dev-login");
  await page.getByRole("button", { name: "以只读身份进入演示" }).click();
  await page.getByRole("link", { name: "订单管理" }).click();
  await page.getByRole("link", { name: "查看详情" }).first().click();
  await expect(page.getByRole("button", { name: "确认订单" })).toHaveCount(0);
});
