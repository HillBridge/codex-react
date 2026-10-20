import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { mockHttp } from "@/test/mockHttp";
import { LoginPage } from "./LoginPage";

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

describe("LoginPage", () => {
  it("submits username and password to the session API", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const adapter = mockHttp({
      data: {
        user: { id: "user-admin", name: "运营管理员" },
        merchant: {
          id: "merchant-east",
          name: "东区旗舰店",
          permissions: ["order:read", "order:update"],
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "用户名" })).toHaveValue("admin");
    expect(screen.getByLabelText("密码")).toHaveValue("admin123");
    expect(screen.queryByRole("button", { name: /进入演示/ })).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.clear(screen.getByRole("textbox", { name: "用户名" }));
    await user.type(screen.getByRole("textbox", { name: "用户名" }), "viewer");
    await user.clear(screen.getByLabelText("密码"));
    await user.type(screen.getByLabelText("密码"), "viewer123");
    await user.click(screen.getByRole("button", { name: "登录" }));
    await waitFor(() =>
      expect(adapter).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/auth/login",
          method: "post",
          data: JSON.stringify({ username: "viewer", password: "viewer123" }),
        }),
      ),
    );
    expect(await screen.findByText("/workspace")).toBeInTheDocument();
  });

  function renderLogin() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    return userEvent.setup();
  }

  it("masks the password and lets the password manager fill both fields", () => {
    renderLogin();

    expect(screen.getByLabelText("密码")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("密码")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByRole("textbox", { name: "用户名" })).toHaveAttribute(
      "autocomplete",
      "username",
    );
  });

  it("shows field errors and does not call the API when fields are empty", async () => {
    const adapter = mockHttp({ data: {} });
    const user = renderLogin();
    await user.clear(screen.getByRole("textbox", { name: "用户名" }));
    await user.clear(screen.getByLabelText("密码"));
    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByText("请输入密码")).toBeInTheDocument();
    expect(adapter).not.toHaveBeenCalled();
  });

  it("trims the username before submitting", async () => {
    const adapter = mockHttp({
      data: {
        user: { id: "user-admin", name: "运营管理员" },
        merchant: {
          id: "merchant-east",
          name: "东区旗舰店",
          permissions: ["order:read"],
        },
      },
    });
    const user = renderLogin();
    await user.type(screen.getByRole("textbox", { name: "用户名" }), "  ");
    await user.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() =>
      expect(adapter).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify({ username: "admin", password: "admin123" }),
        }),
      ),
    );
  });

  it("shows the server's reason inline and allows retrying", async () => {
    const adapter = mockHttp({
      status: 401,
      data: { code: "INVALID_CREDENTIALS", message: "用户名或密码错误。" },
    });
    const user = renderLogin();
    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("用户名或密码错误。");
    expect(screen.getByRole("button", { name: "登录" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "登录" }));
    await waitFor(() => expect(adapter).toHaveBeenCalledTimes(2));
  });
});
