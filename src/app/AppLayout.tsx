import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router";
import { useNavigate } from "react-router";
import { logout, useSession } from "../features/session";
import { Button } from "../shared/ui/button";
import { StatusPanel } from "../shared/ui/status-panel";
import { notifySuccess } from "../shared/ui/toast";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  const session = useSession();
  const merchant = session.data!.merchant;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      notifySuccess("已退出登录");
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className={styles.shell}>
      <aside aria-label="主导航" className={styles.sidebar}>
        <Link aria-label="商户工作台首页" className={styles.brand} to="/">
          商户工作台
        </Link>
        <nav aria-label="业务导航">
          <Link className={styles.navItem} to="/workspace">
            概览
          </Link>
          <Link className={styles.navItem} to="/workspace/orders">
            订单管理
          </Link>
        </nav>
        <span className={styles.environment}>开发环境</span>
      </aside>
      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <span>商户管理控制台</span>
          <div className={styles.accountArea}>
            <span>{session.data?.user.name}</span>
            <Button
              isDisabled={logoutMutation.isPending}
              onPress={() => logoutMutation.mutate()}
              variant="secondary"
            >
              退出登录
            </Button>
          </div>
        </header>
        <main className={styles.content}>
          <h1>{merchant.name}</h1>
          <Outlet />
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
