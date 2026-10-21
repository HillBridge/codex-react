import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/shared/ui/data-table";
import { getProductColumns } from "./productListConfig";
import type { Product } from "./types";

const product: Product = {
  id: "product-1",
  merchantId: "merchant-east",
  sku: "SKU-E0001",
  name: "手冲咖啡豆",
  price: 1800,
  stock: 12,
  status: "off",
};

function renderTable(canEdit: boolean, onEdit = vi.fn()) {
  render(
    <DataTable
      ariaLabel="商品列表"
      rows={[product]}
      columns={getProductColumns({ canEdit, onEdit })}
      getRowId={(row) => row.id}
    />,
  );
  return onEdit;
}

describe("getProductColumns", () => {
  it("renders sku, formatted price, stock and status label", () => {
    renderTable(false);

    expect(screen.getByText("SKU-E0001")).toBeInTheDocument();
    expect(screen.getByText("¥18.00")).toBeInTheDocument();
    expect(screen.getByText("已下架")).toBeInTheDocument();
  });

  it("hides the edit action without permission", () => {
    renderTable(false);

    expect(screen.queryByRole("button", { name: /编辑商品/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
  });

  it("passes the row's product to onEdit", async () => {
    const onEdit = renderTable(true);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "编辑商品 SKU-E0001" }));
    expect(onEdit).toHaveBeenCalledWith(product);
  });
});
