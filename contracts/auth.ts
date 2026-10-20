// 登录接口的契约：后端校验请求，前端登录表单复用。
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string({ error: "请输入用户名" }).trim().min(1, "请输入用户名"),
  // 密码不去除首尾空格，原样提交。
  password: z.string({ error: "请输入密码" }).min(1, "请输入密码"),
});

export type LoginInput = z.infer<typeof loginSchema>;
