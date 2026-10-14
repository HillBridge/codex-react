import { Link, useParams } from "react-router";
import { useSession } from "../features/session";
import { OrderDetails, useOrder } from "../features/orders";
import { StatusPanel } from "../shared/ui/status-panel";

export function OrderDetailPage() {
  const merchant = useSession().data!.merchant;
  const { orderId = "" } = useParams();
  const query = useOrder(merchant.id, orderId);
  if (query.isPending) return <StatusPanel kind="loading" title="正在加载订单详情" />;
  if (query.isError)
    return (
      <StatusPanel
        kind="error"
        title="订单详情加载失败"
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <>
      <Link to="/workspace/orders">返回订单列表</Link>
      <OrderDetails
        order={query.data}
        canUpdate={merchant.permissions.includes("order:update")}
      />
    </>
  );
}
