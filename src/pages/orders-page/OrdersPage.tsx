import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/session";
import type { Order } from "@/entries/order";
import {
  getOrderColumns,
  orderTableFilterFields,
  parseOrderFilters,
  useDeleteOrder,
  useOrders,
} from "@/features/orders";
import { overviewKeys } from "@/features/overview";
import { OrderSummary } from "@/widgets/order-summary";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { TableFilter } from "@/shared/ui/table-filter";
import { Pagination } from "@/shared/ui/pagination";
import { StatusPanel } from "@/shared/ui/status-panel";

export function OrdersPage() {
  const merchant = useSession().data!.merchant;
  const { params, update, setPage, reset } = useUrlParams();
  const filters = parseOrderFilters(params);
  const query = useOrders(merchant.id, filters);
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteOrder();
  const [deleting, setDeleting] = useState<Order | null>(null);
  const columns = getOrderColumns({
    canDelete: merchant.permissions.includes("order:delete"),
    onDelete: setDeleting,
  });

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(
      { merchantId: merchant.id, orderId: deleting.id },
      {
        onSuccess: () => {
          // 订单概况来自 overview，feature 之间不能互相引用，由页面负责让它失效。
          void queryClient.invalidateQueries({
            queryKey: overviewKeys.merchant(merchant.id),
          });
          // 删掉最后一页唯一的一条后，当前页已不存在，退回新的最后一页。
          const remaining = (query.data?.total ?? 1) - 1;
          const lastPage = Math.max(1, Math.ceil(remaining / filters.pageSize));
          if (filters.page > lastPage) setPage(lastPage);
        },
        onSettled: () => setDeleting(null),
      },
    );
  };

  return (
    <>
      <OrderSummary merchantId={merchant.id} showLink={false} columns={5} />
      <TableFilter
        fields={orderTableFilterFields}
        values={{ q: filters.q, status: filters.status }}
        onChange={update}
        onReset={reset}
      />
      {query.isPending ? (
        <StatusPanel kind="loading" title="正在加载订单" />
      ) : query.isError && !query.data ? (
        <StatusPanel
          kind="error"
          title="订单加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data!.items.length ? (
        <DataTable
          ariaLabel="订单列表"
          rows={query.data!.items}
          columns={columns}
          getRowId={(order) => order.id}
        />
      ) : (
        <StatusPanel kind="empty" title="没有符合条件的订单" />
      )}
      {query.data ? (
        <Pagination
          page={filters.page}
          total={query.data.total}
          pageSize={filters.pageSize}
          onChange={setPage}
        />
      ) : null}
      <ConfirmDialog
        isOpen={deleting !== null}
        title="确认删除订单"
        description={`订单 ${deleting?.number ?? ""} 删除后不可恢复。`}
        confirmText="删除"
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
