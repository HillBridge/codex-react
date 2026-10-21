import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("shows the range and moves to the next page", async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} total={45} pageSize={20} onChange={onChange} />);

    expect(screen.getByText("第 1 / 3 页，共 45 条")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled();

    await userEvent.setup().click(screen.getByRole("button", { name: "下一页" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
