import { expect, test } from "@playwright/test";

// H5 兼容：窄视口下每个页面都不能出现整页横向滚动（表格等宽内容由自身容器滚动）。
test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

const paths = [
  "/workspace",
  "/workspace/orders",
  "/workspace/products",
  "/workspace/settlements",
];

test("登录页与工作区各页面在 375px 宽度下无横向溢出", async ({ page }) => {
  const expectNoOverflow = async () =>
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);

  await page.goto("/login");
  await expectNoOverflow();

  await page.getByRole("textbox", { name: "用户名" }).fill("admin");
  await page.getByLabel("密码").fill("admin123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/workspace$/);

  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expectNoOverflow();
  }
});

test("订单列表在手机上以卡片展示，下拉筛选默认折叠", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "用户名" }).fill("admin");
  await page.getByLabel("密码").fill("admin123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.goto("/workspace/orders");

  const statusFilter = page.getByRole("button", { name: /订单状态/ });
  await expect(statusFilter).toBeHidden();
  await page.getByRole("button", { name: "筛选" }).click();
  await expect(statusFilter).toBeVisible();

  // 卡片模式下单元格纵向排布：同一行的订单号与金额单元格上下堆叠，而不是并排。
  const row = page.getByRole("row").nth(1);
  const boxes = await row
    .getByRole("gridcell")
    .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().top));
  expect(new Set(boxes).size).toBe(boxes.length);
});

test("手机上导航固定在顶部，下拉选项与新建弹窗以底部抽屉展示", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "用户名" }).fill("admin");
  await page.getByLabel("密码").fill("admin123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/workspace$/);

  // 导航条 sticky：滚动后仍贴在视口顶部。
  await page.goto("/workspace/orders");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const navTop = await page
    .getByRole("complementary", { name: "主导航" })
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(navTop).toBe(0);

  // 下拉选项：选项列表贴着视口底部。
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "筛选" }).click();
  await page.getByRole("button", { name: /订单状态/ }).click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  // 滑入动画结束后，抽屉应占满宽度并贴住视口底部。
  await expect
    .poll(() =>
      listbox.evaluate((el) => {
        const rect = el.parentElement!.parentElement!.getBoundingClientRect();
        return { width: rect.width, bottom: rect.bottom };
      }),
    )
    .toEqual({ width: 375, bottom: 667 });
  await page.getByRole("option").nth(1).click();
  await expect(listbox).toBeHidden();

  // 新建商品弹窗：底部对齐、占满宽度。
  await page.goto("/workspace/products");
  await page.getByRole("button", { name: "新建", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect
    .poll(async () => {
      const box = await dialog.boundingBox();
      return box && { width: box.width, bottom: box.y + box.height };
    })
    .toEqual({ width: 375, bottom: 667 });
});

test("手机上导航收进左侧抽屉，选择页面后自动关闭", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "用户名" }).fill("admin");
  await page.getByLabel("密码").fill("admin123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/workspace$/);

  // 顶部条只有图标：菜单按钮和品牌图标，没有文字菜单。
  await expect(page.getByRole("navigation", { name: "业务导航" })).toBeHidden();
  await expect(page.getByText("商户工作台", { exact: true })).toBeHidden();

  await page.getByRole("button", { name: "打开导航菜单" }).click();
  const drawer = page.getByRole("dialog", { name: "导航菜单" });
  await expect(drawer).toBeVisible();
  await expect
    .poll(async () => {
      const box = await drawer.boundingBox();
      return box && { x: box.x, narrow: box.width < 375 };
    })
    .toEqual({ x: 0, narrow: true });

  await drawer.getByRole("link", { name: "商品管理" }).click();
  await expect(page).toHaveURL(/\/workspace\/products$/);
  await expect(drawer).toBeHidden();
});

test("手机上账号信息收进顶部右侧图标，点击后弹出姓名和退出登录", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "用户名" }).fill("admin");
  await page.getByLabel("密码").fill("admin123");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/workspace$/);

  await expect(page.getByRole("banner")).toBeHidden();
  await expect(page.getByRole("button", { name: "退出登录" })).toBeHidden();

  await page.getByRole("button", { name: "账号菜单" }).click();
  const popover = page.getByRole("dialog", { name: "账号信息" });
  await expect(popover.getByText("运营管理员")).toBeVisible();
  await popover.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
