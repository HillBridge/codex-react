import { useSearchParams } from "react-router";
import { useSession } from "../../features/session";
import {
  OrderFilters,
  OrderTable,
  useOrders,
  parseOrderFilters,
} from "../../features/orders";
import { Button } from "../../shared/ui/button";
import { StatusPanel } from "../../shared/ui/status-panel";
import styles from "./OrdersPage.module.css";

export function OrdersPage() {
  const merchant = useSession().data!.merchant;
  const [params, setParams] = useSearchParams();
  const filters = parseOrderFilters(params);
  const query = useOrders(merchant.id, filters);
  if (query.isPending) return <StatusPanel kind="loading" title="正在加载订单" />;
  if (query.isError)
    return (
      <StatusPanel
        kind="error"
        title="订单加载失败"
        onRetry={() => void query.refetch()}
      />
    );
  const pages = Math.max(1, Math.ceil(query.data.total / filters.pageSize));
  const move = (page: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  };
  return (
    <>
      <OrderFilters />
      {query.data.items.length ? (
        <OrderTable orders={query.data.items} />
      ) : (
        <StatusPanel kind="empty" title="没有符合条件的订单" />
      )}
      <div className={styles.pagination}>
        <Button
          isDisabled={filters.page <= 1}
          onPress={() => move(filters.page - 1)}
          variant="secondary"
        >
          上一页
        </Button>
        <span>
          第 {filters.page} / {pages} 页，共 {query.data.total} 条
        </span>
        <Button
          isDisabled={filters.page >= pages}
          onPress={() => move(filters.page + 1)}
          variant="secondary"
        >
          下一页
        </Button>
      </div>
    </>
  );
}
