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
});
