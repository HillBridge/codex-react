import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { AppLayout } from "./AppLayout";

afterEach(() => vi.unstubAllGlobals());

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

function renderWorkspace(fetch: typeof globalThis.fetch) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["session"], {
    user: { id: "user-admin", name: "运营管理员" },
    merchant: {
      id: "merchant-east",
      name: "东区旗舰店",
      permissions: ["order:read", "order:update"],
    },
  });
  vi.stubGlobal("fetch", fetch);

  const router = createMemoryRouter(
    [
      {
        path: "/workspace",
        element: <AppLayout />,
        children: [{ index: true, element: <LocationProbe /> }],
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
    { initialEntries: ["/workspace"] },
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { queryClient };
}

describe("AppLayout logout", () => {
  it("logs out, clears the session cache, and navigates to login", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const { queryClient } = renderWorkspace(fetch);

    await userEvent.click(screen.getByRole("button", { name: "退出登录" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByText("登录页面")).toBeInTheDocument();
    expect(screen.getByText("/login")).toBeInTheDocument();
    expect(queryClient.getQueryData(["session"])).toBeUndefined();
  });

  it("keeps the current session and reports an error when logout fails", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ code: "INTERNAL_ERROR", message: "服务暂时不可用" }),
          { status: 500 },
        ),
      );
    renderWorkspace(fetch);

    await userEvent.click(screen.getByRole("button", { name: "退出登录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("退出失败");
    expect(screen.getByText("/workspace")).toBeInTheDocument();
  });
});
