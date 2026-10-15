import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "../../../shared/ui/button";
import { Alert } from "../../../shared/ui/alert";
import { notifySuccess } from "../../../shared/ui/toast";
import { resetQueryCache, sessionQueryKey } from "../queries";
import { login as loginRequest } from "../api";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useMutation({
    mutationFn: loginRequest,
    meta: { silent: true },
    onSuccess: async (session) => {
      // 取消在途查询并清除所有缓存
      await resetQueryCache(queryClient);
      // 设置新的 session
      queryClient.setQueryData(sessionQueryKey, session);
      notifySuccess("登录成功");
      navigate("/workspace", { replace: true });
    },
  });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.badge}>商户工作台</span>
        <h1>登录</h1>
        <p>请输入用户名和密码。</p>
        <form
          className={styles.actions}
          onSubmit={(event) => {
            event.preventDefault();
            login.mutate({ username, password });
          }}
        >
          <label>
            用户名
            <input
              aria-label="用户名"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            密码
            <input
              aria-label="密码"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <Button
            isDisabled={login.isPending || !username || !password}
            type="submit"
            variant="primary"
          >
            登录
          </Button>
        </form>
        {login.isError ? (
          <Alert kind="error" title="登录失败" description={login.error.message} />
        ) : null}
      </section>
    </main>
  );
}
