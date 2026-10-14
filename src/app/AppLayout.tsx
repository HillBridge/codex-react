import { Link, Outlet, useOutletContext } from "react-router";
import { MerchantSwitcher, type MerchantRouteContext } from "../features/merchant";
import { StatusPanel } from "../shared/ui/StatusPanel";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  const { merchant, merchants } = useOutletContext<MerchantRouteContext>();

  return (
    <div className={styles.shell}>
      <aside aria-label="主导航" className={styles.sidebar}>
        <Link aria-label="商户工作台首页" className={styles.brand} to="/">
          商户工作台
        </Link>
        <nav aria-label="业务导航">
          <Link className={styles.navItem} to={`/m/${merchant.id}`}>
            概览
          </Link>
          <Link className={styles.navItem} to={`/m/${merchant.id}/orders`}>
            订单管理
          </Link>
        </nav>
        <span className={styles.environment}>开发环境</span>
      </aside>
      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <span>商户管理控制台</span>
          <div className={styles.accountArea}>
            <MerchantSwitcher merchant={merchant} merchants={merchants} />
            <span>
              {merchant.permissions.includes("order:update") ? "管理员账号" : "只读账号"}
            </span>
          </div>
        </header>
        <main className={styles.content}>
          <h1>{merchant.name}</h1>
          <Outlet context={{ merchant, merchants }} />
        </main>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <section className={styles.welcome}>
      <p>管理商户日常经营数据与订单。</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export function NotFoundPage() {
  return <StatusPanel kind="empty" title="页面不存在" />;
}

export function RouteErrorPage() {
  return (
    <StatusPanel
      description="请刷新页面重试；如果问题持续，请联系系统管理员。"
      kind="error"
      title="页面加载失败"
    />
  );
}
