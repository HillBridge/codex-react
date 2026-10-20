import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { ProductFormDialog } from "./ProductFormDialog";

function setup(props: Partial<React.ComponentProps<typeof ProductFormDialog>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<ProductFormDialog isOpen onSubmit={onSubmit} onClose={onClose} {...props} />);
  return { onSubmit, onClose, user: userEvent.setup() };
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "SKU" }), " SKU-NEW1 ");
  await user.type(screen.getByRole("textbox", { name: "商品名称" }), "新品");
  await user.type(screen.getByRole("textbox", { name: "价格（元）" }), "25.5");
  await user.type(screen.getByRole("textbox", { name: "库存" }), "8");
}

const existing = {
  id: "product-1001",
  merchantId: "merchant-east",
  sku: "SKU-E0001",
  name: "手冲咖啡豆 227g",
  price: 1805,
  stock: 12,
  status: "off" as const,
};

describe("ProductFormDialog in edit mode", () => {
  it("prefills the form from the product, converting cents to yuan", () => {
    setup({ product: existing });

    expect(screen.getByRole("dialog", { name: "编辑商品" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("SKU-E0001");
    expect(screen.getByRole("textbox", { name: "商品名称" })).toHaveValue(
      "手冲咖啡豆 227g",
    );
    expect(screen.getByRole("textbox", { name: "价格（元）" })).toHaveValue("18.05");
    expect(screen.getByRole("textbox", { name: "库存" })).toHaveValue("12");
    expect(screen.getByRole("radio", { name: "已下架" })).toBeChecked();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });

  it("submits the edited values in cents", async () => {
    const { onSubmit, user } = setup({ product: existing });
    const price = screen.getByRole("textbox", { name: "价格（元）" });
    await user.clear(price);
    await user.type(price, "20");
    await user.click(screen.getByRole("radio", { name: "在售" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        sku: "SKU-E0001",
        name: "手冲咖啡豆 227g",
        price: 2000,
        stock: 12,
        status: "on",
      }),
    );
  });

  it("validates edited fields like the create form", async () => {
    const { onSubmit, user } = setup({ product: existing });
    await user.clear(screen.getByRole("textbox", { name: "商品名称" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("请输入商品名称")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a saving label while pending", () => {
    setup({ product: existing, isPending: true });

    expect(screen.getByRole("button", { name: "保存中…" })).toBeDisabled();
  });
});

describe("ProductFormDialog", () => {
  it("submits the parsed product with price in cents", async () => {
    const { onSubmit, user } = setup();
    await fill(user);
    await user.click(screen.getByRole("radio", { name: "已下架" }));
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        sku: "SKU-NEW1",
        name: "新品",
        price: 2550,
        stock: 8,
        status: "off",
      }),
    );
  });

  it("defaults the status to on shelf", async () => {
    const { onSubmit, user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "on" })),
    );
  });

  it("turns off browser autocomplete on every text input", () => {
    setup();

    for (const name of ["SKU", "商品名称", "价格（元）", "库存"]) {
      expect(screen.getByRole("textbox", { name })).toHaveAttribute(
        "autocomplete",
        "off",
      );
    }
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
    expect(await screen.findByText("请输入商品名称")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "商品名称" })).toBeInvalid();
    expect(screen.queryByText("请输入价格")).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "商品名称" }), "新品");
    await waitFor(() =>
      expect(screen.queryByText("请输入商品名称")).not.toBeInTheDocument(),
    );
  });

  it("flags format and range errors after blur", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("textbox", { name: "价格（元）" }), "007");
    await user.type(screen.getByRole("textbox", { name: "库存" }), "0123");
    await user.tab();

    expect(await screen.findByText(/整数部分不能以 0 开头/)).toBeInTheDocument();
    expect(screen.getByText("库存必须是非负整数，且不能以 0 开头")).toBeInTheDocument();
  });

  it("shows all errors and does not submit when the form is empty", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "创建" }));

    for (const message of ["请输入 SKU", "请输入商品名称", "请输入价格", "请输入库存"]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("still submits and shows every error when a field is already invalid", async () => {
    const { onSubmit, user } = setup();
    // 名称先失焦出错，此时它已处于无效状态；直接点创建，其他字段的错误也要出现。
    await user.click(screen.getByRole("textbox", { name: "商品名称" }));
    await user.tab();
    expect(await screen.findByText("请输入商品名称")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "创建" }));

    for (const message of ["请输入 SKU", "请输入价格", "请输入库存"]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("can resubmit after a server error while the marked field is still invalid", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(409, "SKU_DUPLICATED", "该 SKU 已存在。"))
      .mockResolvedValue(undefined);
    const { user } = setup({ onSubmit });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));
    expect(await screen.findByText("该 SKU 已存在")).toBeInTheDocument();

    // 只改别的字段，SKU 仍带着服务端错误，也要能再次提交。
    await user.type(screen.getByRole("textbox", { name: "库存" }), "1");
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it("does not validate the focused field when cancel is pressed", async () => {
    const { onClose, user } = setup();
    // SKU 打开时自动聚焦，点取消会让它失焦。
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText("请输入 SKU")).not.toBeInTheDocument();
  });

  it("does not validate when the pointer goes down outside the form", async () => {
    const { user } = setup();
    expect(screen.getByRole("textbox", { name: "SKU" })).toHaveFocus();
    // 点遮罩等价于点在表单之外。
    await user.click(document.body);

    expect(screen.queryByText("请输入 SKU")).not.toBeInTheDocument();
  });

  it("still validates when focus moves to another field with the pointer", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("textbox", { name: "商品名称" }));

    expect(await screen.findByText("请输入 SKU")).toBeInTheDocument();
  });

  it("marks the sku field when the server reports a duplicate, and clears it on edit", async () => {
    const { user } = setup({
      onSubmit: vi
        .fn()
        .mockRejectedValue(new ApiError(409, "SKU_DUPLICATED", "该 SKU 已存在。")),
    });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(await screen.findByText("该 SKU 已存在")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "SKU" })).toBeInvalid();

    await user.type(screen.getByRole("textbox", { name: "SKU" }), "2");
    await waitFor(() =>
      expect(screen.queryByText("该 SKU 已存在")).not.toBeInTheDocument(),
    );
  });

  it("shows server validation messages in an alert", async () => {
    const { user } = setup({
      onSubmit: vi
        .fn()
        .mockRejectedValue(
          new ApiError(400, "VALIDATION_ERROR", "库存必须是不小于 0 的整数。"),
        ),
    });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "库存必须是不小于 0 的整数。",
    );
  });

  it("ignores other failures because the caller already reported them", async () => {
    const { user } = setup({
      onSubmit: vi
        .fn()
        .mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "服务暂时不可用")),
    });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "创建" })).toBeEnabled(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("closes on cancel and locks the buttons while pending", async () => {
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
