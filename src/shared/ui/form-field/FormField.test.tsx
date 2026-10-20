import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormRadioGroup } from "./FormRadioGroup";
import { FormTextField } from "./FormTextField";

const schema = z.object({ code: z.string().min(1, "请输入编码"), kind: z.string() });
type Values = z.infer<typeof schema>;

function Harness({
  shouldSkipBlur,
  onValues,
}: {
  shouldSkipBlur?: () => boolean;
  onValues?: (values: Values) => void;
}) {
  const { control, handleSubmit } = useForm<Values>({
    mode: "onTouched",
    defaultValues: { code: "", kind: "a" },
    resolver: zodResolver(schema),
  });
  return (
    <form onSubmit={handleSubmit((values) => onValues?.(values))}>
      <FormTextField
        control={control}
        name="code"
        label="编码"
        sanitize={(value) => value.replace(/\d/g, "")}
        shouldSkipBlur={shouldSkipBlur}
      />
      <FormRadioGroup
        control={control}
        name="kind"
        label="类型"
        options={[
          { value: "a", label: "甲" },
          { value: "b", label: "乙" },
        ]}
      />
      <button type="submit">提交</button>
    </form>
  );
}

describe("FormTextField / FormRadioGroup", () => {
  it("sanitizes input and writes both fields into the form values", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();
    render(<Harness onValues={onValues} />);

    await user.type(screen.getByRole("textbox", { name: "编码" }), "ab12c");
    await user.click(screen.getByRole("radio", { name: "乙" }));
    await user.click(screen.getByRole("button", { name: "提交" }));

    expect(screen.getByRole("textbox", { name: "编码" })).toHaveValue("abc");
    await waitFor(() =>
      expect(onValues).toHaveBeenCalledWith({ code: "abc", kind: "b" }),
    );
  });

  it("shows the error message after blur and marks the input invalid", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("textbox", { name: "编码" }));
    await user.tab();

    expect(await screen.findByText("请输入编码")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "编码" })).toBeInvalid();
  });

  it("skips validation on blur when shouldSkipBlur returns true", async () => {
    const user = userEvent.setup();
    render(<Harness shouldSkipBlur={() => true} />);

    await user.click(screen.getByRole("textbox", { name: "编码" }));
    await user.tab();

    expect(screen.queryByText("请输入编码")).not.toBeInTheDocument();
  });
});
