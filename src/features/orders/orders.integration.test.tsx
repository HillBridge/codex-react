import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { http, HttpResponse } from "msw";
import { createAppRoutes } from "../../app/routes";
import { server } from "../../mocks/server";

afterEach(cleanup);

function renderApp(initialEntry: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(createAppRoutes(), {
    initialEntries: [initialEntry],
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("order workflow", () => {
  it("opens merchant orders and filters by order number", async () => {
    const user = userEvent.setup();
    renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    expect(await screen.findByRole("grid", { name: "订单列表" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /搜索订单/ }), "1002");
    await user.click(screen.getByRole("button", { name: "查询" }));
    expect(await screen.findByText("OD202610120002")).toBeInTheDocument();
    expect(screen.queryByText("OD202610120001")).not.toBeInTheDocument();
  });

  it("shows detail and updates order state for an authorized user", async () => {
    const user = userEvent.setup();
    const router = renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    await screen.findByRole("grid", { name: "订单列表" });
    await user.click(screen.getAllByRole("link", { name: "查看详情" })[0]!);
    expect(await screen.findByRole("button", { name: "确认订单" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认订单" }));
    await waitFor(() => expect(screen.getByText("confirmed")).toBeInTheDocument());
    expect(router.state.location.pathname).toContain("/orders/order-");
  });

  it("does not expose order mutations to a read-only merchant role", async () => {
    const user = userEvent.setup();
    renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以只读身份进入演示" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    await screen.findByRole("grid", { name: "订单列表" });
    await user.click(screen.getAllByRole("link", { name: "查看详情" })[0]!);
    expect(await screen.findByText("OD202610120001")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "确认订单" })).not.toBeInTheDocument();
  });

  it("surfaces an optimistic concurrency conflict and reloads the order", async () => {
    server.use(
      http.patch("*/api/merchants/:merchantId/orders/:orderId/status", () =>
        HttpResponse.json(
          {
            code: "ORDER_CONFLICT",
            message: "订单状态已变化",
            requestId: "conflict-test",
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    await screen.findByRole("grid", { name: "订单列表" });
    await user.click(screen.getAllByRole("link", { name: "查看详情" })[0]!);
    await user.click(await screen.findByRole("button", { name: "确认订单" }));
    expect(await screen.findByText("订单已被其他操作更新")).toBeInTheDocument();
    expect(await screen.findByText("pending")).toBeInTheDocument();
  });

  it("does not render another merchant's orders after switching context", async () => {
    const user = userEvent.setup();
    renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    await screen.findByRole("grid", { name: "订单列表" });
    await user.click(screen.getByRole("button", { name: /切换商户/ }));
    await user.click(await screen.findByRole("option", { name: "西区生活馆" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    expect(await screen.findByText("OD202610120101")).toBeInTheDocument();
    expect(screen.queryByText("OD202610120001")).not.toBeInTheDocument();
  });

  it("returns to development login when a protected business API expires the session", async () => {
    server.use(
      http.get("*/api/session", () =>
        HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 }),
      ),
      http.get("*/api/merchants/:merchantId/orders", () =>
        HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    await user.click(await screen.findByRole("link", { name: "订单管理" }));
    expect(
      await screen.findByRole("button", { name: "以管理员身份进入演示" }),
    ).toBeInTheDocument();
  });
});
