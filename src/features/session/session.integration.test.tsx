import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { createAppRoutes } from "../../app/routes";
import { server } from "../../mocks/server";

afterEach(cleanup);

function renderApp(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(createAppRoutes(), {
    initialEntries: [initialEntry],
  });
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}

describe("session and merchant context", () => {
  it("logs in through the development mock and opens the first merchant", async () => {
    const user = userEvent.setup();
    renderApp("/dev-login");

    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));

    expect(await screen.findByRole("heading", { name: "东区旗舰店" })).toBeDefined();
  });

  it("returns a protected route to development login after a 401", async () => {
    server.use(
      http.get("*/api/session", () =>
        HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 }),
      ),
    );
    renderApp("/m/merchant-east");

    expect(
      await screen.findByRole("button", { name: "以管理员身份进入演示" }),
    ).toBeDefined();
  });

  it("changes the merchant route and title when the merchant is switched", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    await screen.findByRole("heading", { name: "东区旗舰店" });
    await user.click(screen.getByRole("button", { name: /切换商户/ }));
    await user.click(await screen.findByRole("option", { name: "西区生活馆" }));

    expect(await screen.findByRole("heading", { name: "西区生活馆" })).toBeDefined();
    await waitFor(() => expect(router.state.location.pathname).toBe("/m/merchant-west"));
  });

  it("shows the selected user's merchant permissions", async () => {
    const user = userEvent.setup();
    renderApp("/dev-login");

    await user.click(await screen.findByRole("button", { name: "以只读身份进入演示" }));

    expect(await screen.findByText("只读账号")).toBeDefined();
  });

  it("clears the previous identity's merchant cache when demo users switch", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以管理员身份进入演示" }));
    expect(await screen.findByText("管理员账号")).toBeInTheDocument();
    await router.navigate("/dev-login");
    await user.click(await screen.findByRole("button", { name: "以只读身份进入演示" }));
    expect(await screen.findByText("只读账号")).toBeInTheDocument();
  });
});
