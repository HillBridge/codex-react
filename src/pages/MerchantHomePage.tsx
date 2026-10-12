import { useOutletContext } from "react-router";
import type { MerchantRouteContext } from "../features/merchant";
import styles from "./MerchantHomePage.module.css";

export function MerchantHomePage() {
  const { merchant } = useOutletContext<MerchantRouteContext>();

  return (
    <section className={styles.card}>
      <p>当前工作区：{merchant.name}</p>
      <p>从左侧导航进入订单管理，查看和处理订单。</p>
    </section>
  );
}
