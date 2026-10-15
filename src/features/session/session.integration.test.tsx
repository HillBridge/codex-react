import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { createAppRoutes } from "../../app/routes";
import { notifyWarning } from "../../shared/ui/toast";
import { mockHttp } from "../../test/mockHttp";

vi.mock("../../shared/ui/toast", () => ({
  notifyWarning: vi.fn(),
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
  ToastViewport: () => null,
}));

const adminSession = {
  user: { id: "user-admin", name: "运营管理员" },
  merchant: {
    id: "merchant-east",
    name: "东区旗舰店",
    permissions: ["order:read", "order:update"],
  },
};

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("session scoped routing", () => {
  it("redirects a restored session directly to the fixed workspace route", async () => {
    mockHttp({ data: adminSession });
    const router = renderAt("/");

    expect(
      await screen.findByRole("heading", { name: "东区旗舰店" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workspace");
    expect(screen.getByText("运营管理员")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("does not expose the removed merchant-scoped route", async () => {
    mockHttp({ data: adminSession });
    renderAt("/m/merchant-west");

    expect(
      await screen.findByRole("heading", { name: "页面不存在" }),
    ).toBeInTheDocument();
  });
});

describe("session expiry", () => {
  it("shows one notice and returns to login when several requests report 401", async () => {
    mockHttp({ data: adminSession });
    const router = renderAt("/workspace");
    await screen.findByRole("heading", { name: "东区旗舰店" });

    window.dispatchEvent(new Event("app:session-expired"));
    window.dispatchEvent(new Event("app:session-expired"));
    window.dispatchEvent(new Event("app:session-expired"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(notifyWarning).toHaveBeenCalledTimes(1);
    expect(notifyWarning).toHaveBeenCalledWith("登录已过期，请重新登录。", {
      id: "session-expired",
    });
  });

  it("does not announce expiry when nobody was logged in", async () => {
    mockHttp({ status: 401, data: { code: "UNAUTHENTICATED", message: "请先登录。" } });
    const router = renderAt("/workspace");

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(notifyWarning).not.toHaveBeenCalled();
  });
});
