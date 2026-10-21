import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/shared/ui/button";
import { TableFilter, type TableFilterField } from "./TableFilter";

const fields: TableFilterField[] = [
  { type: "search", key: "q", label: "关键字", ariaLabel: "搜索关键字" },
  {
    type: "select",
    key: "status",
    label: "状态",
    options: [
      { id: "all", label: "全部" },
      { id: "on", label: "启用" },
    ],
  },
];

describe("TableFilter", () => {
  it("renders the configured controls", () => {
    render(
      <TableFilter
        fields={fields}
        values={{ q: "", status: "all" }}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: /搜索关键字/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查询" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
  });

  it("submits the search draft on query and clears it on reset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <TableFilter
        fields={fields}
        values={{ q: "", status: "all" }}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /搜索关键字/ }), "abc");
    await user.click(screen.getByRole("button", { name: "查询" }));
    expect(onChange).toHaveBeenCalledWith({ q: "abc" });

    await user.click(screen.getByRole("button", { name: "重置" }));
    expect(onReset).toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /搜索关键字/ })).toHaveValue("");
  });

  it("renders custom actions after the default buttons and keeps them independent", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onDownload = vi.fn();
    render(
      <TableFilter
        fields={fields}
        values={{ q: "", status: "all" }}
        onChange={onChange}
        onReset={vi.fn()}
        actions={<Button onPress={onDownload}>下载</Button>}
      />,
    );

    const names = screen.getAllByRole("button").map((button) => button.textContent);
    expect(names.slice(-3)).toEqual(["查询", "重置", "下载"]);

    await user.click(screen.getByRole("button", { name: "下载" }));
    expect(onDownload).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
  });
});
