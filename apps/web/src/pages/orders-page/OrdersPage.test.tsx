import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { saveBlob } from "@/shared/lib/download";
import { mockHttp, type MockReply } from "@/test/mockHttp";
import { OrdersPage } from "./OrdersPage";

vi.mock("@/features/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/session")>()),
  useSession: () => ({
    data: {
      user: { id: "u1", name: "管理员" },
      merchant: { id: "merchant-east", name: "东区", permissions: ["order:read"] },
    },
  }),
}));
vi.mock("@/shared/lib/download", () => ({ saveBlob: vi.fn() }));

const overview = {
  orders: { total: 25, pending: 9, confirmed: 8, cancelled: 8, confirmedAmount: 12500 },
  settlements: { pendingCount: 2, pendingAmount: 30000 },
  products: { onShelf: 9, offShelf: 3, lowStock: 4 },
};
const csv = new Blob(["csv"], { type: "text/csv" });

function renderPage(entry: string, exportReply: MockReply = { data: csv }) {
  const adapter = mockHttp((config) => {
    if (config.url?.endsWith("/orders/export")) return exportReply;
    if (config.url?.endsWith("/orders")) {
      return { data: { items: [], total: 0, page: 1, pageSize: 10 } };
    }
    return { data: overview };
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[entry]}>
        <OrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return adapter;
}

describe("OrdersPage download", () => {
  it("exports with the current filters but without pagination, then saves the file", async () => {
    const user = userEvent.setup();
    const adapter = renderPage("/?status=pending&q=1200&page=3&pageSize=20");

    await user.click(await screen.findByRole("button", { name: "下载" }));

    await waitFor(() => expect(saveBlob).toHaveBeenCalledWith(csv, "orders.csv"));
    const exportCall = adapter.mock.calls
      .map(([config]) => config)
      .find((config) => config.url === "/api/merchants/merchant-east/orders/export");
    expect(exportCall?.params).toEqual({ status: "pending", q: "1200" });
    expect(exportCall?.responseType).toBe("blob");
  });

  it("does not save a file when the export fails", async () => {
    const user = userEvent.setup();
    const adapter = renderPage("/", { status: 500, data: {} });

    await user.click(await screen.findByRole("button", { name: "下载" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "下载" })).toBeEnabled(),
    );
    expect(
      adapter.mock.calls.some(([config]) => config.url?.endsWith("/orders/export")),
    ).toBe(true);
    expect(saveBlob).not.toHaveBeenCalled();
  });
});
