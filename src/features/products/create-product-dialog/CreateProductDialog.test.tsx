import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { CreateProductDialog } from "./CreateProductDialog";

function setup(props: Partial<React.ComponentProps<typeof CreateProductDialog>> = {}) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<CreateProductDialog isOpen onSubmit={onSubmit} onClose={onClose} {...props} />);
  return { onSubmit, onClose, user: userEvent.setup() };
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "SKU" }), " SKU-NEW1 ");
  await user.type(screen.getByRole("textbox", { name: "商品名称" }), "新品");
  await user.type(screen.getByRole("textbox", { name: "价格（元）" }), "25.5");
  await user.type(screen.getByRole("textbox", { name: "库存" }), "8");
}

describe("CreateProductDialog", () => {
  it("turns off browser autocomplete on every text input", () => {
    setup();

    for (const name of ["SKU", "商品名称", "价格（元）", "库存"]) {
      expect(screen.getByRole("textbox", { name })).toHaveAttribute(
        "autocomplete",
        "off",
      );
    }
  });

  it("submits the parsed product with price in cents", async () => {
    const { onSubmit, user } = setup();
    await fill(user);
    await user.click(screen.getByRole("radio", { name: "已下架" }));
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(onSubmit).toHaveBeenCalledWith({
      sku: "SKU-NEW1",
      name: "新品",
      price: 2550,
      stock: 8,
      status: "off",
    });
  });

  it("defaults the status to on shelf", async () => {
    const { onSubmit, user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "on" }));
  });

  it("filters out characters that can never be valid while typing", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("textbox", { name: "SKU" }), "SKU 1!中_a");
    await user.type(screen.getByRole("textbox", { name: "价格（元）" }), "32.3sadfasfd9");
    await user.type(screen.getByRole("textbox", { name: "库存" }), "32323safasf");

    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("SKU1_a");
    expect(screen.getByRole("textbox", { name: "价格（元）" })).toHaveValue("32.39");
    expect(screen.getByRole("textbox", { name: "库存" })).toHaveValue("32323");
  });

  it("validates a field on blur but not before it is touched", async () => {
    const { user } = setup();
    expect(screen.queryByText("请输入商品名称")).not.toBeInTheDocument();

    await user.click(screen.getByRole("textbox", { name: "商品名称" }));
    await user.tab();
    expect(screen.getByText("请输入商品名称")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "商品名称" })).toBeInvalid();
    expect(screen.queryByText("请输入价格")).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "商品名称" }), "新品");
    expect(screen.queryByText("请输入商品名称")).not.toBeInTheDocument();
  });

  it("flags format and range errors after blur", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("textbox", { name: "价格（元）" }), "007");
    await user.type(screen.getByRole("textbox", { name: "库存" }), "0123");
    await user.tab();

    expect(screen.getByText(/整数部分不能以 0 开头/)).toBeInTheDocument();
    expect(screen.getByText("库存必须是非负整数，且不能以 0 开头")).toBeInTheDocument();
  });

  it("shows all errors and does not submit when the form is empty", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(onSubmit).not.toHaveBeenCalled();
    for (const message of ["请输入 SKU", "请输入商品名称", "请输入价格", "请输入库存"]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });

  it("marks the sku field when the server reports a duplicate", async () => {
    const { user } = setup({
      error: new ApiError(409, "SKU_DUPLICATED", "该 SKU 已存在。"),
    });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(screen.getByText("该 SKU 已存在")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "SKU" })).toBeInvalid();
  });

  it("drops the duplicate hint once the sku is edited", async () => {
    const { user } = setup({
      error: new ApiError(409, "SKU_DUPLICATED", "该 SKU 已存在。"),
    });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));
    expect(screen.getByText("该 SKU 已存在")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "SKU" }), "2");
    expect(screen.queryByText("该 SKU 已存在")).not.toBeInTheDocument();
  });

  it("shows server validation messages in an alert", () => {
    setup({
      error: new ApiError(400, "VALIDATION_ERROR", "库存必须是不小于 0 的整数。"),
    });

    expect(screen.getByRole("alert")).toHaveTextContent("库存必须是不小于 0 的整数。");
  });

  it("disables the actions while pending and closes on cancel", async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("locks the buttons while pending", () => {
    setup({ isPending: true });

    expect(screen.getByRole("button", { name: "创建中…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
  });
});
