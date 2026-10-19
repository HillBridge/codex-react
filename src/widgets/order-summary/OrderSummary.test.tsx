import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { mockHttp } from "@/test/mockHttp";
import { OrderSummary } from "./OrderSummary";

const overview = {
  orders: { total: 25, pending: 9, confirmed: 8, cancelled: 8, confirmedAmount: 12500 },
  settlements: { pendingCount: 2, pendingAmount: 30000 },
  products: { onShelf: 9, offShelf: 3, lowStock: 4 },
};

function renderWidget(showLink = true) {
  const adapter = mockHttp({ data: overview });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <OrderSummary merchantId="merchant-east" showLink={showLink} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return adapter;
}

describe("OrderSummary", () => {
  it("shows counts per status with the shared labels and amount format", async () => {
    const adapter = renderWidget();

    expect(await screen.findByText("订单总数")).toBeInTheDocument();
    expect(screen.getByText("待处理")).toBeInTheDocument();
    expect(screen.getByText("¥125.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看订单" })).toHaveAttribute(
      "href",
      "/workspace/orders",
    );
    expect(adapter.mock.calls[0][0].url).toBe("/api/merchants/merchant-east/overview");
  });

  it("hides the link when showLink is false", async () => {
    renderWidget(false);

    expect(await screen.findByRole("region")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "查看订单" })).not.toBeInTheDocument();
  });
});
