import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockHttp } from "@/test/mockHttp";
import { SettlementOrders } from "./SettlementOrders";

const settlement = {
  id: "settlement-1001",
  number: "ST202610001",
  periodStart: "2026-10-12",
  periodEnd: "2026-10-12",
  status: "paid" as const,
  orderCount: 1,
  amount: 12500,
};

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("SettlementOrders", () => {
  it("lists the orders of the opened settlement using order display rules", async () => {
    const adapter = mockHttp({
      data: {
        items: [
          {
            id: "order-1001",
            merchantId: "merchant-east",
            number: "OD202610120001",
            createdAt: "2026-10-12T10:00:00.000Z",
            amount: 12500,
            status: "confirmed",
            version: 1,
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={newClient()}>
        <SettlementOrders
          merchantId="merchant-east"
          settlement={settlement}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("OD202610120001")).toBeInTheDocument();
    expect(screen.getByText("¥125.00")).toBeInTheDocument();
    expect(screen.getByText("已确认")).toBeInTheDocument();
    expect(adapter.mock.calls[0][0].url).toBe(
      "/api/merchants/merchant-east/settlements/settlement-1001/orders",
    );
  });

  it("does not request anything while closed", () => {
    const adapter = mockHttp({ data: { items: [] } });
    render(
      <QueryClientProvider client={newClient()}>
        <SettlementOrders
          merchantId="merchant-east"
          settlement={null}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );
    expect(adapter).not.toHaveBeenCalled();
  });

  describe("opening without flicker", () => {
    const orders = {
      items: [
        {
          id: "order-1001",
          merchantId: "merchant-east",
          number: "OD202610120001",
          createdAt: "2026-10-12T10:00:00.000Z",
          amount: 12500,
          status: "confirmed",
          version: 1,
        },
      ],
    };

    const renderOpen = () =>
      render(
        <QueryClientProvider client={newClient()}>
          <SettlementOrders
            merchantId="merchant-east"
            settlement={settlement}
            onClose={vi.fn()}
          />
        </QueryClientProvider>,
      );

    it("opens directly with the content when the data arrives quickly", async () => {
      mockHttp({ data: orders });
      renderOpen();

      // 数据到达前弹窗不出现，加载中也不出现。
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("正在加载订单")).not.toBeInTheDocument();

      expect(await screen.findByText("OD202610120001")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens with the error when the request fails quickly", async () => {
      mockHttp({
        status: 500,
        data: { code: "INTERNAL_ERROR", message: "服务暂时不可用" },
      });
      renderOpen();

      expect(await screen.findByText("订单加载失败")).toBeInTheDocument();
    });

    it("reopens instantly from cache the second time", async () => {
      mockHttp({ data: orders });
      const client = newClient();
      const ui = (open: boolean) => (
        <QueryClientProvider client={client}>
          <SettlementOrders
            merchantId="merchant-east"
            settlement={open ? settlement : null}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      );
      const { rerender } = render(ui(true));
      expect(await screen.findByText("OD202610120001")).toBeInTheDocument();

      rerender(ui(false));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      rerender(ui(true));
      expect(screen.getByText("OD202610120001")).toBeInTheDocument();
    });
  });
});
