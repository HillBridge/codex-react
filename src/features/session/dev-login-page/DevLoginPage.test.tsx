import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { DevLoginPage } from "./DevLoginPage";

describe("DevLoginPage", () => {
  it("renders the development login options", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DevLoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "开发环境演示登录" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "以管理员身份进入演示" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "以只读身份进入演示" }),
    ).toBeInTheDocument();
  });
});
