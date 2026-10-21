import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the title, each stat and the action", () => {
    render(
      <StatCard
        title="示例概况"
        stats={[
          { label: "总数", value: 25 },
          { label: "金额", value: "¥10.00" },
        ]}
        action={<a href="/x">查看全部</a>}
      />,
    );

    expect(screen.getByRole("region", { name: "示例概况" })).toBeInTheDocument();
    expect(screen.getByText("总数")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看全部" })).toBeInTheDocument();
  });

  it("uses 3 columns by default and the given column count when set", () => {
    const stats = [{ label: "总数", value: 1 }];
    const { rerender } = render(<StatCard title="示例概况" stats={stats} />);
    expect(screen.getByRole("term").parentElement?.parentElement).toHaveStyle(
      "--stat-columns: 3",
    );

    rerender(<StatCard title="示例概况" stats={stats} columns={5} />);
    expect(screen.getByRole("term").parentElement?.parentElement).toHaveStyle(
      "--stat-columns: 5",
    );
  });
});
