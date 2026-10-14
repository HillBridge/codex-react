import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { MerchantSwitcher } from "./MerchantSwitcher";

function CurrentPath() {
  const { pathname } = useLocation();
  return <output>{pathname}</output>;
}

describe("MerchantSwitcher", () => {
  it("navigates to the selected merchant", async () => {
    const user = userEvent.setup();
    const merchants = [
      { id: "east", name: "东区便利店", permissions: ["order:update"] },
      { id: "west", name: "西区生活馆", permissions: [] },
    ];

    render(
      <MemoryRouter initialEntries={["/m/east"]}>
        <MerchantSwitcher merchant={merchants[0]} merchants={merchants} />
        <CurrentPath />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /切换商户/ }));
    await user.click(await screen.findByRole("option", { name: "西区生活馆" }));

    expect(screen.getByText("/m/west")).toBeInTheDocument();
  });
});
