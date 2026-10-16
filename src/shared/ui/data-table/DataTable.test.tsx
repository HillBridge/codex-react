import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./DataTable";

describe("DataTable", () => {
  it("renders headers and one row per item from the column config", () => {
    const rows = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
    ];

    render(
      <DataTable
        ariaLabel="示例列表"
        rows={rows}
        getRowId={(row) => row.id}
        columns={[
          { key: "name", header: "名称", isRowHeader: true, cell: (r) => r.name },
        ]}
      />,
    );

    expect(screen.getByRole("grid", { name: "示例列表" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "名称" })).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
});
