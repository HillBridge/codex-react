// 登录与会话的接口契约：后端校验请求，前端登录表单复用，会话响应类型两端共用。
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string({ error: "请输入用户名" }).trim().min(1, "请输入用户名"),
  // 密码不去除首尾空格，原样提交。
  password: z.string({ error: "请输入密码" }).min(1, "请输入密码"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const permissionSchema = z.enum([
  "order:read",
  "order:update",
  "order:delete",
  "product:create",
  "product:update",
]);

export const sessionSchema = z.object({
  user: z.object({ id: z.string(), name: z.string() }),
  merchant: z.object({
    id: z.string(),
    name: z.string(),
    permissions: z.array(permissionSchema),
  }),
});

export type Permission = z.infer<typeof permissionSchema>;
export type Session = z.infer<typeof sessionSchema>;
