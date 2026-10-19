import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { mockHttp } from "@/test/mockHttp";
import { SettlementSummary } from "./SettlementSummary";

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
        <SettlementSummary merchantId="merchant-east" showLink={showLink} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return adapter;
}

describe("SettlementSummary", () => {
  it("shows pending settlement count and amount", async () => {
    renderWidget();

    expect(await screen.findByText("待结算单数")).toBeInTheDocument();
    expect(screen.getByText("¥300.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看待结算" })).toHaveAttribute(
      "href",
      "/workspace/settlements?status=pending",
    );
  });

  it("hides the link when showLink is false", async () => {
    renderWidget(false);

    expect(await screen.findByRole("region")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "查看待结算" })).not.toBeInTheDocument();
  });
});
