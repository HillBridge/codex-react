import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("activates with the keyboard and exposes its variant", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    render(
      <>
        <button>Before</button>
        <Button variant="primary" onPress={onPress}>
          Save
        </Button>
      </>,
    );

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(onPress).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Save" }).className).toContain("primary");
  });
});
