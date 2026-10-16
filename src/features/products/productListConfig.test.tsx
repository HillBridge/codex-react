import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "@/shared/ui/data-table";
import { productColumns } from "./productListConfig";

describe("productColumns", () => {
  it("renders sku, formatted price, stock and status label", () => {
    render(
      <DataTable
        ariaLabel="商品列表"
        rows={[
          {
            id: "product-1",
            merchantId: "merchant-east",
            sku: "SKU-E0001",
            name: "手冲咖啡豆",
            price: 1800,
            stock: 12,
            status: "off" as const,
          },
        ]}
        columns={productColumns}
        getRowId={(product) => product.id}
      />,
    );

    expect(screen.getByText("SKU-E0001")).toBeInTheDocument();
    expect(screen.getByText("¥18.00")).toBeInTheDocument();
    expect(screen.getByText("已下架")).toBeInTheDocument();
  });
});
