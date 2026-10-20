import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth";

const messageOf = (value: unknown) => {
  const result = loginSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0].message;
};

describe("loginSchema", () => {
  it("trims the username but keeps the password as typed", () => {
    expect(loginSchema.parse({ username: " admin ", password: " p w " })).toEqual({
      username: "admin",
      password: " p w ",
    });
  });

  it.each([
    [{ username: "  ", password: "x" }, "请输入用户名"],
    [{ username: "admin", password: "" }, "请输入密码"],
    [{ password: "x" }, "请输入用户名"],
    [{ username: "admin" }, "请输入密码"],
    [{ username: 1, password: "x" }, "请输入用户名"],
    [{}, "请输入用户名"],
  ])("rejects %j", (value, message) => {
    expect(messageOf(value)).toBe(message);
  });
});
