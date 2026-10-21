import { Form } from "react-aria-components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAbandonGuard } from "@/shared/hooks/useAbandonGuard";
import { ApiError } from "@/shared/api/ApiError";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { FormRadioGroup, FormTextField } from "@/shared/ui/form-field";
import {
  emptyProductFormValues,
  productFormSchema,
  productToFormValues,
  sanitizeName,
  sanitizePrice,
  sanitizeSku,
  sanitizeStock,
  type ProductFormOutput,
  type ProductFormValues,
} from "./productForm";
import type { NewProduct, Product } from "../types";
import styles from "./ProductFormDialog.module.css";

interface ProductFormDialogProps {
  isOpen: boolean;
  // 传入则为编辑，表单预填该商品；不传为新建。
  product?: Product;
  // 提交中，期间不能取消或点遮罩关闭。
  isPending?: boolean;
  // 提交失败时 reject。SKU 重复和校验失败由这里就地展示，其余失败调用方已自行提示。
  onSubmit: (product: NewProduct) => Promise<unknown>;
  onClose: () => void;
}

export function ProductFormDialog({
  isOpen,
  product,
  isPending = false,
  onSubmit,
  onClose,
}: ProductFormDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title={product ? "编辑商品" : "新建商品"}
      isDismissable={!isPending}
      onClose={onClose}
    >
      <ProductFormBody
        product={product}
        isPending={isPending}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Dialog>
  );
}

// 弹出框关闭时 Dialog 会卸载内容，所以每次打开都是一份全新的表单。
function ProductFormBody({
  product,
  isPending,
  onSubmit,
  onCancel,
}: {
  product?: Product;
  isPending: boolean;
  onSubmit: (product: NewProduct) => Promise<unknown>;
  onCancel: () => void;
}) {
  const { formRef, shouldSkipBlur } = useAbandonGuard();
  const { control, handleSubmit, setError, formState } = useForm<
    ProductFormValues,
    unknown,
    ProductFormOutput
  >({
    resolver: zodResolver(productFormSchema),
    // 字段失焦后开始校验，之后每次输入实时更新。
    mode: "onTouched",
    defaultValues: product ? productToFormValues(product) : emptyProductFormValues,
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (!(error instanceof ApiError)) return;
      if (error.code === "SKU_DUPLICATED") {
        setError("sku", { type: "server", message: "该 SKU 已存在" });
      } else if (error.code === "VALIDATION_ERROR") {
        setError("root.server", { type: "server", message: error.message });
      }
    }
  });

  const serverMessage = formState.errors.root?.server?.message;

  return (
    <Form
      ref={formRef}
      className={styles.form}
      validationBehavior="aria"
      onSubmit={submit}
    >
      {serverMessage ? (
        <Alert kind="error" title="提交失败" description={serverMessage} />
      ) : null}
      <FormTextField
        control={control}
        name="sku"
        label="SKU"
        placeholder="例如 SKU-E0013"
        autoFocus
        sanitize={sanitizeSku}
        shouldSkipBlur={shouldSkipBlur}
      />
      <FormTextField
        control={control}
        name="name"
        label="商品名称"
        sanitize={sanitizeName}
        shouldSkipBlur={shouldSkipBlur}
      />
      <div className={styles.row}>
        <FormTextField
          control={control}
          name="price"
          label="价格（元）"
          placeholder="0.00"
          inputMode="decimal"
          sanitize={sanitizePrice}
          shouldSkipBlur={shouldSkipBlur}
        />
        <FormTextField
          control={control}
          name="stock"
          label="库存"
          placeholder="0"
          inputMode="numeric"
          sanitize={sanitizeStock}
          shouldSkipBlur={shouldSkipBlur}
        />
      </div>
      <FormRadioGroup
        control={control}
        name="status"
        label="商品状态"
        options={[
          { value: "on", label: "在售" },
          { value: "off", label: "已下架" },
        ]}
      />
      <div className={styles.actions}>
        <Button
          variant="secondary"
          isDisabled={isPending}
          data-abandon
          onPress={onCancel}
        >
          取消
        </Button>
        <Button variant="primary" type="submit" isDisabled={isPending}>
          {isPending ? (product ? "保存中…" : "创建中…") : product ? "保存" : "创建"}
        </Button>
      </div>
    </Form>
  );
}
