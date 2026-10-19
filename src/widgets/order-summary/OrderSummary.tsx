import { Link } from "react-router";
import { formatOrderAmount, orderStatusLabels } from "@/entries/order";
import { useOverview } from "@/features/overview";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusPanel } from "@/shared/ui/status-panel";

interface OrderSummaryProps {
  merchantId: string;
  // 在目标页面自身展示时隐藏跳转链接。
  showLink?: boolean;
  // 每行展示几项，默认 3；订单页卡片够宽，传 5 排成一行。
  columns?: number;
}

export function OrderSummary({
  merchantId,
  showLink = true,
  columns,
}: OrderSummaryProps) {
  const query = useOverview(merchantId);

  if (query.isPending) return <StatusPanel kind="loading" title="正在加载订单概况" />;
  if (query.isError && !query.data) {
    return (
      <StatusPanel
        kind="error"
        title="订单概况加载失败"
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { orders } = query.data!;
  return (
    <StatCard
      title="订单概况"
      columns={columns}
      action={showLink ? <Link to="/workspace/orders">查看订单</Link> : undefined}
      stats={[
        { label: "订单总数", value: orders.total },
        { label: orderStatusLabels.pending, value: orders.pending },
        { label: orderStatusLabels.confirmed, value: orders.confirmed },
        { label: orderStatusLabels.cancelled, value: orders.cancelled },
        { label: "已确认金额", value: formatOrderAmount(orders.confirmedAmount) },
      ]}
    />
  );
}
