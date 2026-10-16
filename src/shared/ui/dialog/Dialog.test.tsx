import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("shows the close button only when requested and calls onClose", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog isOpen title="标题" onClose={onClose}>
        内容
      </Dialog>,
    );
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();

    rerender(
      <Dialog isOpen title="标题" onClose={onClose} showCloseButton>
        内容
      </Dialog>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
