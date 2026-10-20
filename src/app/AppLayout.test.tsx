import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { mockHttp, type MockReply } from "@/test/mockHttp";
import { ToastViewport } from "@/shared/ui/toast";
import { AppLayout } from "./AppLayout";
import { createAppQueryClient } from "./queryClient";

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

function renderWorkspace(reply: MockReply, initialPath = "/workspace") {
  const adapter = mockHttp(reply);
  const queryClient = createAppQueryClient();
  queryClient.setQueryData(["session"], {
    user: { id: "user-admin", name: "运营管理员" },
    merchant: {
      id: "merchant-east",
      name: "东区旗舰店",
      permissions: ["order:read", "order:update"],
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: "/workspace",
        element: <AppLayout />,
        children: [
          { index: true, element: <LocationProbe /> },
          { path: "orders", element: <LocationProbe /> },
          { path: "orders/:orderId", element: <LocationProbe /> },
          { path: "products", element: <LocationProbe /> },
        ],
      },
      {
        path: "/login",
        element: (
          <>
            <LocationProbe />
            <p>登录页面</p>
          </>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastViewport />
    </QueryClientProvider>,
  );

  return { queryClient, adapter };
}

describe("AppLayout logout", () => {
  it("logs out, clears the session cache, and navigates to login", async () => {
    const { queryClient, adapter } = renderWorkspace({ status: 204 });

    await userEvent.click(screen.getByRole("button", { name: "退出登录" }));

    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/auth/logout", method: "post" }),
    );
    expect(await screen.findByText("登录页面")).toBeInTheDocument();
    expect(screen.getByText("/login")).toBeInTheDocument();
    expect(queryClient.getQueryData(["session"])).toBeUndefined();
  });

  it("keeps the current session and reports an error when logout fails", async () => {
    renderWorkspace({
      status: 500,
      data: { code: "INTERNAL_ERROR", message: "服务暂时不可用" },
    });

    await userEvent.click(screen.getByRole("button", { name: "退出登录" }));

    expect((await screen.findAllByText("服务暂时不可用")).length).toBeGreaterThan(0);
    expect(screen.getByText("/workspace")).toBeInTheDocument();
  });
});

describe("AppLayout navigation highlight", () => {
  const current = () =>
    screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent);

  it("highlights only the overview on the workspace home", () => {
    renderWorkspace({ status: 204 }, "/workspace");

    expect(current()).toEqual(["概览"]);
  });

  it("highlights the section for the current page and keeps it on nested routes", () => {
    renderWorkspace({ status: 204 }, "/workspace/orders/order-1001");

    expect(current()).toEqual(["订单管理"]);
  });

  it("moves the highlight when navigating to another section", async () => {
    renderWorkspace({ status: 204 }, "/workspace/orders");
    expect(current()).toEqual(["订单管理"]);

    await userEvent.setup().click(screen.getByRole("link", { name: "商品管理" }));
    expect(current()).toEqual(["商品管理"]);
  });
});
