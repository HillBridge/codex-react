import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { mockHttp } from "@/test/mockHttp";
import { ProductSummary } from "./ProductSummary";

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
        <ProductSummary merchantId="merchant-east" showLink={showLink} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return adapter;
}

describe("ProductSummary", () => {
  it("shows shelf and low stock numbers", async () => {
    renderWidget();

    expect(await screen.findByText("库存紧张")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("hides the link when showLink is false", async () => {
    renderWidget(false);

    expect(await screen.findByRole("region")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "查看商品" })).not.toBeInTheDocument();
  });
});
