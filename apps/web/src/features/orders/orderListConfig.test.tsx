import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/shared/ui/data-table";
import { getOrderColumns } from "./orderListConfig";

describe("getOrderColumns", () => {
  const order = {
    id: "order-1",
    merchantId: "merchant-east",
    number: "OD202610120001",
    createdAt: "2026-10-12T10:00:00.000Z",
    amount: 12500,
    status: "pending" as const,
    version: 1,
  };

  const renderTable = (canDelete: boolean, onDelete = vi.fn()) =>
    render(
      <MemoryRouter>
        <DataTable
          ariaLabel="订单列表"
          rows={[order]}
          columns={getOrderColumns({ canDelete, onDelete })}
          getRowId={(row) => row.id}
        />
      </MemoryRouter>,
    );

  it("shows a delete button only with delete permission and reports the row", async () => {
    const onDelete = vi.fn();
    const { unmount } = renderTable(true, onDelete);
    await userEvent.setup().click(screen.getByRole("button", { name: /删除订单/ }));
    expect(onDelete).toHaveBeenCalledWith(order);
    unmount();

    renderTable(false);
    expect(screen.queryByRole("button", { name: /删除订单/ })).not.toBeInTheDocument();
  });

  it("renders the order number, formatted amount and detail link", () => {
    renderTable(false);

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
