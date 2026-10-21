import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderDetails } from "./OrderDetails";

describe("OrderDetails", () => {
  it("renders order information and mutation controls when permitted", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const order = {
      id: "order-1",
      merchantId: "merchant-east",
      number: "OD202610120001",
      createdAt: "2026-10-12T10:00:00.000Z",
      amount: 12500,
      status: "pending" as const,
      version: 1,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <OrderDetails order={order} canUpdate />
      </QueryClientProvider>,
    );

    expect(screen.getByText("OD202610120001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认订单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消订单" })).toBeInTheDocument();
  });
});
