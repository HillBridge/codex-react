import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/session";
import {
  CreateProductDialog,
  parseProductFilters,
  productColumns,
  productTableFilterFields,
  useCreateProduct,
  useProducts,
} from "@/features/products";
import { overviewKeys } from "@/features/overview";
import { ProductSummary } from "@/widgets/product-summary";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { Pagination } from "@/shared/ui/pagination";
import { StatusPanel } from "@/shared/ui/status-panel";
import { TableFilter } from "@/shared/ui/table-filter";

export function ProductsPage() {
  const merchant = useSession().data!.merchant;
  const { params, update, setPage, reset } = useUrlParams();
  const filters = parseProductFilters(params);
  const query = useProducts(merchant.id, filters);
  const queryClient = useQueryClient();
  const createMutation = useCreateProduct();
  const [creating, setCreating] = useState(false);

  const openCreate = () => {
    createMutation.reset();
    setCreating(true);
  };

  return (
    <>
      <ProductSummary merchantId={merchant.id} showLink={false} />
      <TableFilter
        fields={productTableFilterFields}
        values={{ q: filters.q, status: filters.status }}
        onChange={update}
        onReset={reset}
        actions={
          merchant.permissions.includes("product:create") ? (
            <Button variant="primary" onPress={openCreate}>
              新建
            </Button>
          ) : null
        }
      />
      {query.isPending ? (
        <StatusPanel kind="loading" title="正在加载商品" />
      ) : query.isError && !query.data ? (
        <StatusPanel
          kind="error"
          title="商品加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data!.items.length ? (
        <DataTable
          ariaLabel="商品列表"
          rows={query.data!.items}
          columns={productColumns}
          getRowId={(product) => product.id}
        />
      ) : (
        <StatusPanel kind="empty" title="没有符合条件的商品" />
      )}
      {query.data ? (
        <Pagination
          page={filters.page}
          total={query.data.total}
          pageSize={filters.pageSize}
          onChange={setPage}
        />
      ) : null}
      <CreateProductDialog
        isOpen={creating}
        isPending={createMutation.isPending}
        error={createMutation.error}
        onSubmit={(product) =>
          createMutation.mutate(
            { merchantId: merchant.id, product },
            {
              onSuccess: () => {
                // 商品概况来自 overview，feature 之间不能互相引用，由页面负责让它失效。
                void queryClient.invalidateQueries({
                  queryKey: overviewKeys.merchant(merchant.id),
                });
                // 新商品排在最前，回到第一页才能看到。
                setPage(1);
                setCreating(false);
              },
            },
          )
        }
        onClose={() => setCreating(false)}
      />
    </>
  );
}
