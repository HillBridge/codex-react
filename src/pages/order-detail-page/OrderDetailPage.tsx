import { Link, useParams } from "react-router";
import { useSession } from "../../features/session";
import { OrderDetails, useOrder } from "../../features/orders";
import { StatusPanel } from "../../shared/ui/status-panel";

export function OrderDetailPage() {
  const merchant = useSession().data!.merchant;
  const { orderId = "" } = useParams();
  const query = useOrder(merchant.id, orderId);
  return (
    <>
      <Link to="/workspace/orders">返回订单列表</Link>
      {query.data ? (
        <OrderDetails
          order={query.data}
          canUpdate={merchant.permissions.includes("order:update")}
        />
      ) : query.isError ? (
        <StatusPanel
          kind="error"
          title="订单详情加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <StatusPanel kind="loading" title="正在加载订单详情" />
      )}
    </>
  );
}
