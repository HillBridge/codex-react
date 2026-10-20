import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { mockHttp, type MockReply } from "@/test/mockHttp";
import { ProductsPage } from "./ProductsPage";

const permissions = vi.hoisted(() => ({ list: ["product:create"] as string[] }));

vi.mock("@/features/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/session")>()),
  useSession: () => ({
    data: {
      user: { id: "u1", name: "管理员" },
      merchant: { id: "merchant-east", name: "东区", permissions: permissions.list },
    },
  }),
}));

const overview = {
  orders: { total: 25, pending: 9, confirmed: 8, cancelled: 8, confirmedAmount: 12500 },
  settlements: { pendingCount: 2, pendingAmount: 30000 },
  products: { onShelf: 9, offShelf: 3, lowStock: 4 },
};
const created = {
  id: "product-3001",
  merchantId: "merchant-east",
  sku: "SKU-NEW1",
  name: "新品",
  price: 2550,
  stock: 8,
  status: "on",
};

function renderPage(createReply: MockReply = { status: 201, data: created }) {
  const adapter = mockHttp((config) => {
    if (config.method === "post") return createReply;
    if (config.url?.endsWith("/products")) {
      return { data: { items: [], total: 0, page: 1, pageSize: 10 } };
    }
    return { data: overview };
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={["/?page=3"]}>
        <ProductsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const calls = (predicate: (url: string, method?: string) => boolean) =>
    adapter.mock.calls.filter(([c]) => predicate(c.url ?? "", c.method));
  return { calls };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "新建" }));
  const dialog = await screen.findByRole("dialog", { name: "新建商品" });
  await user.type(within(dialog).getByRole("textbox", { name: "SKU" }), "SKU-NEW1");
  await user.type(within(dialog).getByRole("textbox", { name: "商品名称" }), "新品");
  await user.type(within(dialog).getByRole("textbox", { name: "价格（元）" }), "25.5");
  await user.type(within(dialog).getByRole("textbox", { name: "库存" }), "8");
  await user.click(within(dialog).getByRole("button", { name: "创建" }));
}

describe("ProductsPage create", () => {
  it("hides the create button without the product:create permission", async () => {
    permissions.list = ["order:read"];
    renderPage();

    await screen.findByRole("button", { name: "查询" });
    expect(screen.queryByRole("button", { name: "新建" })).not.toBeInTheDocument();
    permissions.list = ["product:create"];
  });

  it("posts the product, refreshes list and overview, and closes the dialog", async () => {
    const user = userEvent.setup();
    const { calls } = renderPage();
    await screen.findByRole("button", { name: "新建" });
    const listLoads = calls(
      (url, method) => url.endsWith("/products") && method !== "post",
    ).length;
    const overviewLoads = calls((url) => url.endsWith("/overview")).length;

    await fillAndSubmit(user);

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "新建商品" })).not.toBeInTheDocument(),
    );
    const [post] = calls((url, method) => url.endsWith("/products") && method === "post");
    expect(post[0].url).toBe("/api/merchants/merchant-east/products");
    expect(JSON.parse(post[0].data)).toEqual({
      sku: "SKU-NEW1",
      name: "新品",
      price: 2550,
      stock: 8,
      status: "on",
    });
    await waitFor(() => {
      expect(
        calls((url, method) => url.endsWith("/products") && method !== "post").length,
      ).toBeGreaterThan(listLoads);
      expect(calls((url) => url.endsWith("/overview")).length).toBeGreaterThan(
        overviewLoads,
      );
    });
  });

  it("keeps the dialog open and marks sku when it is duplicated", async () => {
    const user = userEvent.setup();
    renderPage({
      status: 409,
      data: { code: "SKU_DUPLICATED", message: "该 SKU 已存在。" },
    });

    await fillAndSubmit(user);

    const dialog = await screen.findByRole("dialog", { name: "新建商品" });
    expect(await within(dialog).findByText("该 SKU 已存在")).toBeInTheDocument();
  });
});
