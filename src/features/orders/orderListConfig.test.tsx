import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { DataTable } from "@/shared/ui/data-table";
import { orderColumns } from "./orderListConfig";

describe("orderColumns", () => {
  it("renders the order number, formatted amount and detail link", () => {
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
        <DataTable
          ariaLabel="订单列表"
          rows={orders}
          columns={orderColumns}
          getRowId={(order) => order.id}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("grid", { name: "订单列表" })).toBeInTheDocument();
    expect(screen.getByText("OD202610120001")).toBeInTheDocument();
    expect(screen.getByText("¥125.00")).toBeInTheDocument();
    expect(screen.getByText("待处理")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute(
      "href",
      "/order-1",
    );
  });
});
