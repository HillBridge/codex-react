import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

describe("LoginPage", () => {
  it("submits username and password to the session API", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: { id: "user-admin", name: "运营管理员" },
          merchant: {
            id: "merchant-east",
            name: "东区旗舰店",
            permissions: ["order:read", "order:update"],
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetch);

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
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          body: JSON.stringify({ username: "viewer", password: "viewer123" }),
        }),
      ),
    );
    expect(await screen.findByText("/m/merchant-east")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
