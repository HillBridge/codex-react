import { expect, test, type Page } from "@playwright/test";

// 后端数据在内存中且被所有用例共享、并行执行：
// 只读断言用不会被改动的数据（viewer 的西区、admin 的商品与结算），
// 会修改数据的用例各自只动一条订单，且不断言会因此变化的总数。

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "用户名" }).fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
}

const loginAsAdmin = (page: Page) => login(page, "admin", "admin123");
const loginAsViewer = (page: Page) => login(page, "viewer", "viewer123");

async function selectStatus(page: Page, field: string, option: string) {
  await page.getByRole("button", { name: new RegExp(field) }).click();
  await page.getByRole("option", { name: option }).click();
}

test.describe("登录与会话", () => {
  test("错误密码停留在登录页并提示原因", async ({ page }) => {
    await login(page, "admin", "wrong-password");

    await expect(page.getByText("用户名或密码错误。")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("未登录访问工作区页面会跳转到登录页", async ({ page }) => {
    await page.goto("/workspace/orders");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
  });

  test("登录后进入概览，退出登录回到登录页", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: "东区旗舰店" })).toBeVisible();
    await expect(page.getByText("运营管理员")).toBeVisible();

    await page.getByRole("button", { name: "退出登录" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // 退出后会话已失效，不能再直接进入工作区。
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("概览页", () => {
  test("展示商户信息和订单、结算、商品三块概况", async ({ page }) => {
    await loginAsViewer(page);

    await expect(page.getByRole("heading", { name: "西区生活馆" })).toBeVisible();
    await expect(page.getByText("当前工作区：西区生活馆")).toBeVisible();
    await expect(page.getByText("订单概况", { exact: true })).toBeVisible();
    await expect(page.getByText("结算概况", { exact: true })).toBeVisible();
    await expect(page.getByText("商品概况", { exact: true })).toBeVisible();
  });

  test("概况卡片的链接能跳转到对应页面", async ({ page }) => {
    await loginAsViewer(page);

    await page.getByRole("link", { name: "查看订单" }).click();
    await expect(page).toHaveURL(/\/workspace\/orders$/);

    await page.getByRole("link", { name: "概览" }).click();
    await page.getByRole("link", { name: "查看待结算" }).click();
    await expect(page).toHaveURL(/\/workspace\/settlements\?status=pending$/);

    await page.getByRole("link", { name: "概览" }).click();
    await page.getByRole("link", { name: "查看商品" }).click();
    await expect(page).toHaveURL(/\/workspace\/products$/);
  });
});

test.describe("订单管理", () => {
  test("展示订单列表和分页，可翻页", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "订单管理" }).click();

    const grid = page.getByRole("grid", { name: "订单列表" });
    await expect(grid).toBeVisible();
    // 东区订单超过一页；不断言具体页数，避免受每页条数和删除用例影响。
    await expect(page.getByText(/第 1 \/ \d+ 页/)).toBeVisible();
    await expect(page.getByRole("button", { name: "上一页" })).toBeDisabled();

    await page.getByRole("button", { name: "下一页" }).click();
    await expect(page.getByText(/第 2 \/ \d+ 页/)).toBeVisible();
    await expect(page.getByRole("button", { name: "上一页" })).toBeEnabled();
  });

  test("按状态筛选并可重置", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "订单管理" }).click();

    await selectStatus(page, "订单状态", "已取消");
    await page.getByRole("button", { name: "查询" }).click();
    await expect(page).toHaveURL(/status=cancelled/);
    const rows = page.getByRole("grid", { name: "订单列表" }).getByRole("row");
    await expect(rows.nth(1)).toContainText("已取消");

    await page.getByRole("button", { name: "重置" }).click();
    await expect(page).not.toHaveURL(/status=/);
  });

  test("搜索无结果时显示空状态", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "订单管理" }).click();

    await page.getByRole("textbox", { name: /搜索订单/ }).fill("NOT-EXIST");
    await page.getByRole("button", { name: "查询" }).click();
    await expect(page.getByText("没有符合条件的订单")).toBeVisible();
  });

  test("订单详情可返回列表，取消订单后状态更新", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "订单管理" }).click();
    await page.getByRole("textbox", { name: /搜索订单/ }).fill("OD202610130003");
    await page.getByRole("button", { name: "查询" }).click();
    await page
      .getByRole("row", { name: /OD202610130003/ })
      .getByRole("link", { name: "查看详情" })
      .click();

    await expect(page.getByText("OD202610130003")).toBeVisible();
    await page.getByRole("link", { name: "返回订单列表" }).click();
    await expect(page).toHaveURL(/\/workspace\/orders/);
  });

  test("有删除权限的角色可删除订单，取消则保留", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "订单管理" }).click();
    await page.getByRole("textbox", { name: /搜索订单/ }).fill("OD202610130010");
    await page.getByRole("button", { name: "查询" }).click();

    await page.getByRole("button", { name: "删除订单 OD202610130010" }).click();
    await expect(page.getByText("订单 OD202610130010 删除后不可恢复。")).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(page.getByText("OD202610130010")).toBeVisible();

    await page.getByRole("button", { name: "删除订单 OD202610130010" }).click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await expect(page.getByText("订单已删除")).toBeVisible();
    await expect(page.getByText("没有符合条件的订单")).toBeVisible();
  });

  test("只读角色看不到删除按钮", async ({ page }) => {
    await loginAsViewer(page);
    await page.getByRole("link", { name: "订单管理" }).click();

    await expect(page.getByRole("grid", { name: "订单列表" })).toBeVisible();
    await expect(page.getByRole("button", { name: /删除订单/ })).toHaveCount(0);
  });

  test("不存在的订单详情显示错误并可重试", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/workspace/orders/order-not-exist");

    await expect(page.getByText("订单详情加载失败")).toBeVisible();
    await expect(page.getByRole("button", { name: "重试" })).toBeVisible();
  });
});

test.describe("商品管理", () => {
  test("新建商品：校验、SKU 重复提示，创建后出现在列表", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "商品管理" }).click();
    await page.getByRole("button", { name: "新建" }).click();

    const dialog = page.getByRole("dialog", { name: "新建商品" });
    await dialog.getByRole("button", { name: "创建" }).click();
    await expect(dialog.getByText("请输入商品名称")).toBeVisible();

    // SKU 重复由后端判定，弹出框保持打开并标在 SKU 上。
    await dialog.getByRole("textbox", { name: "SKU" }).fill("SKU-E0001");
    await dialog.getByRole("textbox", { name: "商品名称" }).fill("重复商品");
    await dialog.getByRole("textbox", { name: "价格（元）" }).fill("9.9");
    await dialog.getByRole("textbox", { name: "库存" }).fill("3");
    await dialog.getByRole("button", { name: "创建" }).click();
    await expect(dialog.getByText("该 SKU 已存在")).toBeVisible();

    await dialog.getByRole("textbox", { name: "SKU" }).fill("SKU-E2E-NEW");
    await dialog.getByRole("textbox", { name: "商品名称" }).fill("端到端新品");
    await dialog.getByRole("button", { name: "创建" }).click();

    await expect(dialog).toBeHidden();
    const row = page.getByRole("row", { name: /SKU-E2E-NEW/ });
    await expect(row).toContainText("端到端新品");
    await expect(row).toContainText("¥9.90");
    await expect(row).toContainText("在售");
  });

  test("编辑商品：预填原值，修改后列表更新，SKU 与其他商品重复被拒绝", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "商品管理" }).click();
    // 只动一个专属商品，避免影响并行用例读取的种子数据。
    await page.getByRole("button", { name: "新建" }).click();
    let dialog = page.getByRole("dialog", { name: "新建商品" });
    await dialog.getByRole("textbox", { name: "SKU" }).fill("SKU-E2E-EDIT");
    await dialog.getByRole("textbox", { name: "商品名称" }).fill("待编辑商品");
    await dialog.getByRole("textbox", { name: "价格（元）" }).fill("5");
    await dialog.getByRole("textbox", { name: "库存" }).fill("2");
    await dialog.getByRole("button", { name: "创建" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "编辑商品 SKU-E2E-EDIT" }).click();
    dialog = page.getByRole("dialog", { name: "编辑商品" });
    await expect(dialog.getByRole("textbox", { name: "商品名称" })).toHaveValue(
      "待编辑商品",
    );
    await expect(dialog.getByRole("textbox", { name: "价格（元）" })).toHaveValue("5.00");

    await dialog.getByRole("textbox", { name: "SKU" }).fill("SKU-E0001");
    await dialog.getByRole("button", { name: "保存" }).click();
    await expect(dialog.getByText("该 SKU 已存在")).toBeVisible();

    await dialog.getByRole("textbox", { name: "SKU" }).fill("SKU-E2E-EDIT");
    await dialog.getByRole("textbox", { name: "商品名称" }).fill("已编辑商品");
    await dialog.getByRole("radio", { name: "已下架" }).check({ force: true });
    await dialog.getByRole("button", { name: "保存" }).click();

    await expect(dialog).toBeHidden();
    const row = page.getByRole("row", { name: /SKU-E2E-EDIT/ });
    await expect(row).toContainText("已编辑商品");
    await expect(row).toContainText("已下架");
  });

  test("没有 product:create 权限的商户看不到新建按钮", async ({ page }) => {
    await loginAsViewer(page);
    await page.getByRole("link", { name: "商品管理" }).click();

    await expect(page.getByRole("grid", { name: "商品列表" })).toBeVisible();
    await expect(page.getByRole("button", { name: "新建" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /编辑商品/ })).toHaveCount(0);
  });

  test("展示商品列表和概况，无链接指向自身", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "商品管理" }).click();

    await expect(page).toHaveURL(/\/workspace\/products$/);
    await expect(page.getByRole("grid", { name: "商品列表" })).toBeVisible();
    await expect(page.getByText("商品概况", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "查看商品" })).toHaveCount(0);
    await expect(page.getByText("手冲咖啡豆 227g")).toBeVisible();
  });

  test("按名称搜索", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "商品管理" }).click();

    await page.getByRole("textbox", { name: "搜索商品" }).fill("法压壶");
    await page.getByRole("button", { name: "查询" }).click();
    await expect(page.getByText("法压壶")).toBeVisible();
    await expect(page.getByText("手冲咖啡豆 227g")).toHaveCount(0);
  });

  test("按状态筛选只显示已下架商品", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "商品管理" }).click();

    await selectStatus(page, "商品状态", "已下架");
    await page.getByRole("button", { name: "查询" }).click();
    await expect(page).toHaveURL(/status=off/);
    await expect(page.getByRole("grid", { name: "商品列表" })).toContainText("已下架");
    await expect(page.getByRole("grid", { name: "商品列表" })).not.toContainText("在售");
  });

  test("搜索无结果时显示空状态", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "商品管理" }).click();

    await page.getByRole("textbox", { name: "搜索商品" }).fill("NOT-EXIST");
    await page.getByRole("button", { name: "查询" }).click();
    await expect(page.getByText("没有符合条件的商品")).toBeVisible();
  });

  test("只能看到自己商户的商品", async ({ page }) => {
    await loginAsViewer(page);
    await page.getByRole("link", { name: "商品管理" }).click();

    await expect(page.getByText("有机棉布袋")).toBeVisible();
    await expect(page.getByText("手冲咖啡豆 227g")).toHaveCount(0);
  });
});

test.describe("结算管理", () => {
  test("展示结算单列表和概况", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "结算管理" }).click();

    await expect(page).toHaveURL(/\/workspace\/settlements$/);
    await expect(page.getByRole("grid", { name: "结算单列表" })).toBeVisible();
    await expect(page.getByText("结算概况", { exact: true })).toBeVisible();
    await expect(page.getByText("ST202610001")).toBeVisible();
    await expect(page.getByText("ST202610003")).toBeVisible();
  });

  test("按结算状态筛选", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "结算管理" }).click();

    await selectStatus(page, "结算状态", "已结算");
    await page.getByRole("button", { name: "查询" }).click();
    await expect(page).toHaveURL(/status=paid/);
    await expect(page.getByText("ST202610001")).toBeVisible();
    await expect(page.getByText("ST202610002")).toHaveCount(0);
  });

  test("查看结算单包含的订单并关闭弹窗", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "结算管理" }).click();

    await page.getByRole("button", { name: "查看结算单 ST202610001 的订单" }).click();
    const dialog = page.getByRole("dialog", { name: /ST202610001 包含的订单/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("grid", { name: "结算订单列表" })).toBeVisible();
    await expect(dialog.getByText("OD202610120001")).toBeVisible();

    await dialog.getByRole("button", { name: /关闭/ }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("从概览的查看待结算进入时已按待结算筛选", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("link", { name: "查看待结算" }).click();

    await expect(page.getByText("ST202610002")).toBeVisible();
    await expect(page.getByText("ST202610001")).toHaveCount(0);
  });
});

test.describe("导航与兜底页面", () => {
  test("侧边栏可依次进入各业务页面", async ({ page }) => {
    await loginAsAdmin(page);

    for (const [name, path] of [
      ["订单管理", "/workspace/orders"],
      ["商品管理", "/workspace/products"],
      ["结算管理", "/workspace/settlements"],
      ["概览", "/workspace"],
    ] as const) {
      await page.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { name: "东区旗舰店" })).toBeVisible();
    }
  });

  test("工作区内不存在的路径显示 404", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/workspace/not-exist");

    await expect(page.getByText("页面不存在")).toBeVisible();
    await expect(page.getByRole("link", { name: "订单管理" })).toBeVisible();
  });

  test("站点级不存在的路径显示 404", async ({ page }) => {
    await page.goto("/not-exist");

    await expect(page.getByText("页面不存在")).toBeVisible();
  });
});
