import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPanel } from "./StatusPanel";

describe("StatusPanel", () => {
  it.each([
    ["loading", "正在加载"],
    ["empty", "暂无订单"],
    ["error", "加载失败"],
    ["forbidden", "无权访问"],
  ] as const)("renders the %s state title", (kind, title) => {
    render(<StatusPanel kind={kind} title={title} />);

    expect(screen.getByRole("heading", { name: title })).toBeDefined();
  });
});
