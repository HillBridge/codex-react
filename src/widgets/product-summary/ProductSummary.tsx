import { Link } from "react-router";
import { useOverview } from "@/features/overview";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusPanel } from "@/shared/ui/status-panel";

interface ProductSummaryProps {
  merchantId: string;
  // 在目标页面自身展示时隐藏跳转链接。
  showLink?: boolean;
}

export function ProductSummary({ merchantId, showLink = true }: ProductSummaryProps) {
  const query = useOverview(merchantId);

  if (query.isPending) return <StatusPanel kind="loading" title="正在加载商品概况" />;
  if (query.isError && !query.data) {
    return (
      <StatusPanel
        kind="error"
        title="商品概况加载失败"
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { products } = query.data!;
  return (
    <StatCard
      title="商品概况"
      action={showLink ? <Link to="/workspace/products">查看商品</Link> : undefined}
      stats={[
        { label: "在售", value: products.onShelf },
        { label: "已下架", value: products.offShelf },
        { label: "库存紧张", value: products.lowStock },
      ]}
    />
  );
}
