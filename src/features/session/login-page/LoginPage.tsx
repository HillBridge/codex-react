import { Form } from "react-aria-components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { loginSchema, type LoginInput } from "@contracts/auth";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { FormTextField } from "@/shared/ui/form-field";
import { notifySuccess } from "@/shared/ui/toast";
import { resetQueryCache, sessionQueryKey } from "../queries";
import { login as loginRequest } from "../api";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useMutation({
    mutationFn: loginRequest,
    // 失败原因（如密码错误）由表单就地展示。
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
  const { control, handleSubmit, setError, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    // 演示环境预填账号。
    defaultValues: { username: "admin", password: "admin123" },
  });

  const submit = handleSubmit(async (credentials) => {
    try {
      await login.mutateAsync(credentials);
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: error instanceof Error ? error.message : "登录失败，请稍后重试。",
      });
    }
  });
  const serverMessage = formState.errors.root?.server?.message;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.badge}>商户工作台</span>
        <h1>登录</h1>
        <p>请输入用户名和密码。</p>
        <Form className={styles.actions} validationBehavior="aria" onSubmit={submit}>
          <FormTextField
            control={control}
            name="username"
            label="用户名"
            autoComplete="username"
          />
          <FormTextField
            control={control}
            name="password"
            label="密码"
            type="password"
            autoComplete="current-password"
          />
          <Button isDisabled={login.isPending} type="submit" variant="primary">
            登录
          </Button>
        </Form>
        {serverMessage ? (
          <Alert kind="error" title="登录失败" description={serverMessage} />
        ) : null}
      </section>
    </main>
  );
}
