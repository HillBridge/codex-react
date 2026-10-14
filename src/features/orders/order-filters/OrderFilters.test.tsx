import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { OrderFilters } from "./OrderFilters";

describe("OrderFilters", () => {
  it("renders search and status filter controls", () => {
    render(
      <MemoryRouter>
        <OrderFilters />
      </MemoryRouter>,
    );

    expect(screen.getByRole("textbox", { name: /搜索订单/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查询" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
  });
});
