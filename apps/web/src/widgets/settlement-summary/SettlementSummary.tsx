import { Link } from "react-router";
import { useOverview } from "@/features/overview";
import { formatCents } from "@/shared/lib/format";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusPanel } from "@/shared/ui/status-panel";

interface SettlementSummaryProps {
  merchantId: string;
  // 在目标页面自身展示时隐藏跳转链接。
  showLink?: boolean;
}

export function SettlementSummary({
  merchantId,
  showLink = true,
}: SettlementSummaryProps) {
  const query = useOverview(merchantId);

  if (query.isPending) return <StatusPanel kind="loading" title="正在加载结算概况" />;
  if (query.isError && !query.data) {
    return (
      <StatusPanel
        kind="error"
        title="结算概况加载失败"
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { settlements } = query.data!;
  return (
    <StatCard
      title="结算概况"
      action={
        showLink ? (
          <Link to="/workspace/settlements?status=pending">查看待结算</Link>
        ) : undefined
      }
      stats={[
        { label: "待结算单数", value: settlements.pendingCount },
        { label: "待结算金额", value: formatCents(settlements.pendingAmount) },
      ]}
    />
  );
}
