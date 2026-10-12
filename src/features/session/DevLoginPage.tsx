import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "../../shared/ui/Button";
import { StatusPanel } from "../../shared/ui/StatusPanel";
import { sessionQueryKey } from "./queries";
import { startDevSession } from "./api";
import styles from "./DevLoginPage.module.css";

export function DevLoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useMutation({
    mutationFn: startDevSession,
    onSuccess: async (session) => {
      await queryClient.cancelQueries();
      queryClient.clear();
      queryClient.setQueryData(sessionQueryKey, session);
      navigate("/", { replace: true });
    },
  });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.badge}>仅开发环境可用</span>
        <h1>开发环境演示登录</h1>
        <p>请选择一个模拟身份。此登录仅用于本地开发，不代表生产身份认证。</p>
        <div className={styles.actions}>
          <Button
            isDisabled={login.isPending}
            onPress={() => login.mutate("user-admin")}
            variant="primary"
          >
            以管理员身份进入演示
          </Button>
          <Button
            isDisabled={login.isPending}
            onPress={() => login.mutate("user-viewer")}
            variant="secondary"
          >
            以只读身份进入演示
          </Button>
        </div>
        {login.isError ? (
          <StatusPanel
            kind="error"
            title="演示登录失败"
            description={login.error.message}
          />
        ) : null}
      </section>
    </main>
  );
}
