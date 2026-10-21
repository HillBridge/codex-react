import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
  Popover,
} from "react-aria-components";
import { Link, NavLink, Outlet } from "react-router";
import { useNavigate } from "react-router";
import { logout, resetQueryCache, useSession } from "@/features/session";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { Button } from "@/shared/ui/button";
import { StatusPanel } from "@/shared/ui/status-panel";
import { notifySuccess } from "@/shared/ui/toast";
import { MenuIcon, UserIcon } from "./icons";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await resetQueryCache(queryClient);
      notifySuccess("已退出登录");
      navigate("/login", { replace: true });
    },
  });

  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = (
    <nav aria-label="业务导航" className={styles.nav}>
      {/* NavLink 在当前路径匹配时自动设置 aria-current="page"，样式据此高亮。 */}
      {[
        { to: "/workspace", label: "概览", end: true },
        { to: "/workspace/orders", label: "订单管理" },
        { to: "/workspace/products", label: "商品管理" },
        { to: "/workspace/settlements", label: "结算管理" },
      ].map((item) => (
        <NavLink
          className={styles.navItem}
          end={item.end}
          key={item.to}
          onClick={() => setMenuOpen(false)}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const logoutButton = (
    <Button
      isDisabled={logoutMutation.isPending}
      onPress={() => logoutMutation.mutate()}
      variant="secondary"
    >
      退出登录
    </Button>
  );

  // 退出登录时会话缓存先被清空、随后才跳转到登录页，这一小段时间里没有会话数据，不渲染而不是报错。
  const merchant = session.data?.merchant;
  if (!merchant) return null;

  return (
    <div className={styles.shell}>
      <aside aria-label="主导航" className={styles.sidebar}>
        {isMobile ? (
          <>
            <AriaButton
              aria-label="打开导航菜单"
              className={styles.menuButton}
              onPress={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </AriaButton>
            {/* 账号信息收进右侧图标，点击后弹出姓名和退出登录。 */}
            <DialogTrigger>
              <AriaButton
                aria-label="账号菜单"
                className={`${styles.menuButton} ${styles.userButton}`}
              >
                <UserIcon />
              </AriaButton>
              <Popover className={styles.userPopover} placement="bottom end">
                <Dialog aria-label="账号信息" className={styles.userDialog}>
                  <span>{session.data?.user.name}</span>
                  {logoutButton}
                </Dialog>
              </Popover>
            </DialogTrigger>
            {/* 手机上菜单收进左侧抽屉，选择页面后自动关闭。 */}
            <ModalOverlay
              className={styles.drawerOverlay}
              isDismissable
              isOpen={menuOpen}
              onOpenChange={setMenuOpen}
            >
              <Modal className={styles.drawer}>
                <Dialog aria-label="导航菜单" className={styles.drawerDialog}>
                  <span className={styles.brand}>商户工作台</span>
                  {navigation}
                  <span className={styles.environment}>开发环境</span>
                </Dialog>
              </Modal>
            </ModalOverlay>
          </>
        ) : (
          <>
            <Link aria-label="商户工作台首页" className={styles.brand} to="/">
              商户工作台
            </Link>
            {navigation}
            <span className={styles.environment}>开发环境</span>
          </>
        )}
      </aside>
      <div className={styles.mainColumn}>
        {isMobile ? null : (
          <header className={styles.topbar}>
            <span>商户管理控制台</span>
            <div className={styles.accountArea}>
              <span>{session.data?.user.name}</span>
              {logoutButton}
            </div>
          </header>
        )}
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
