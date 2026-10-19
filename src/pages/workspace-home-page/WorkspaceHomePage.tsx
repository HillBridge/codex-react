import { useSession } from "@/features/session";
import { OrderSummary } from "@/widgets/order-summary";
import { ProductSummary } from "@/widgets/product-summary";
import { SettlementSummary } from "@/widgets/settlement-summary";
import styles from "./WorkspaceHomePage.module.css";

export function WorkspaceHomePage() {
  const merchant = useSession().data!.merchant;

  return (
    <>
      <section className={styles.card}>
        <p>当前工作区：{merchant.name}</p>
        <p>从左侧导航进入订单、商品、结算管理，查看和处理经营数据。</p>
      </section>
      <div className={styles.widgets}>
        <OrderSummary merchantId={merchant.id} />
        <SettlementSummary merchantId={merchant.id} />
        <ProductSummary merchantId={merchant.id} />
      </div>
    </>
  );
}
