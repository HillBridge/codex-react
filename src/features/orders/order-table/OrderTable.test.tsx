import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { OrderTable } from "./OrderTable";

describe("OrderTable", () => {
  it("renders the supplied order in the labeled table", () => {
    const orders = [
      {
        id: "order-1",
        merchantId: "merchant-east",
        number: "OD202610120001",
        createdAt: "2026-10-12T10:00:00.000Z",
        amount: 12500,
        status: "pending" as const,
        version: 1,
      },
    ];

    render(
      <MemoryRouter>
        <OrderTable orders={orders} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("grid", { name: "订单列表" })).toBeInTheDocument();
    expect(screen.getByText("OD202610120001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute(
      "href",
      "/order-1",
    );
  });
});
