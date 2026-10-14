import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppRoutes } from "../../app/routes";

afterEach(() => vi.unstubAllGlobals());

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
  it("redirects a restored session directly to its merchant workspace", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(adminSession), { status: 200 })),
    );
    const router = renderAt("/");

    expect(
      await screen.findByRole("heading", { name: "东区旗舰店" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/m/merchant-east");
    expect(screen.getByText("运营管理员")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("rejects a route for a merchant outside the restored session", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(adminSession), { status: 200 })),
    );
    renderAt("/m/merchant-west");

    expect(
      await screen.findByRole("heading", { name: "无权访问该商户" }),
    ).toBeInTheDocument();
  });
});
