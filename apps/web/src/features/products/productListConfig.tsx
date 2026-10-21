import { Button } from "@/shared/ui/button";
import { formatCents } from "@/shared/lib/format";
import { TableActions, type DataTableColumn } from "@/shared/ui/data-table";
import type { TableFilterField } from "@/shared/ui/table-filter";
import type { Product, ProductStatus } from "./types";

const statusLabels: Record<ProductStatus, string> = {
  on: "在售",
  off: "已下架",
};

interface ProductColumnOptions {
  canEdit: boolean;
  onEdit: (product: Product) => void;
}

export const getProductColumns = ({
  canEdit,
  onEdit,
}: ProductColumnOptions): DataTableColumn<Product>[] => [
  { key: "sku", header: "SKU", isRowHeader: true, cell: (product) => product.sku },
  { key: "name", header: "商品名称", cell: (product) => product.name },
  { key: "price", header: "价格", cell: (product) => formatCents(product.price) },
  { key: "stock", header: "库存", cell: (product) => product.stock },
  { key: "status", header: "状态", cell: (product) => statusLabels[product.status] },
  ...(canEdit
    ? [
        {
          key: "actions",
          header: "操作",
          isActions: true,
          cell: (product: Product) => (
            <TableActions>
              <Button
                variant="secondary"
                aria-label={`编辑商品 ${product.sku}`}
                onPress={() => onEdit(product)}
              >
                编辑
              </Button>
            </TableActions>
          ),
        },
      ]
    : []),
];

export const productTableFilterFields: TableFilterField[] = [
  {
    type: "search",
    key: "q",
    label: "商品",
    ariaLabel: "搜索商品",
    placeholder: "输入名称或 SKU",
  },
  {
    type: "select",
    key: "status",
    label: "商品状态",
    options: [
      { id: "all", label: "全部状态" },
      ...Object.entries(statusLabels).map(([id, label]) => ({ id, label })),
    ],
  },
];
