import { useSession } from "@/features/session";
import styles from "./WorkspaceHomePage.module.css";

export function WorkspaceHomePage() {
  const merchant = useSession().data!.merchant;

  return (
    <section className={styles.card}>
      <p>当前工作区：{merchant.name}</p>
      <p>从左侧导航进入订单、商品、结算管理，查看和处理经营数据。</p>
    </section>
  );
}
