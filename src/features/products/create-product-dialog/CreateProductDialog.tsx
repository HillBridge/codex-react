import { useState, type SyntheticEvent } from "react";
import {
  Form,
  Input,
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  Text,
  TextField,
} from "react-aria-components";
import { ApiError } from "@/shared/api/ApiError";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import {
  parseProductForm,
  sanitizeProductField,
  validateProductField,
  type ProductFormErrors,
  type ProductFormValues,
  type ProductTextField,
} from "../productForm";
import type { NewProduct, ProductStatus } from "../types";
import styles from "./CreateProductDialog.module.css";

const textFields: ProductTextField[] = ["sku", "name", "price", "stock"];

interface CreateProductDialogProps {
  isOpen: boolean;
  isPending?: boolean;
  // 提交失败的错误；SKU 重复就地标在输入框上，校验失败用 Alert 展示。
  error?: Error | null;
  onSubmit: (product: NewProduct) => void;
  onClose: () => void;
}

export function CreateProductDialog({
  isOpen,
  isPending = false,
  error,
  onSubmit,
  onClose,
}: CreateProductDialogProps) {
  return (
    <Dialog isOpen={isOpen} title="新建商品" isDismissable={!isPending} onClose={onClose}>
      <CreateProductForm
        isPending={isPending}
        error={error}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Dialog>
  );
}

// 弹出框关闭时 Dialog 会卸载内容，所以每次打开都是一份全新的表单。
function CreateProductForm({
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  isPending: boolean;
  error?: Error | null;
  onSubmit: (product: NewProduct) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    sku: "",
    name: "",
    price: "",
    stock: "",
    status: "on",
  });
  // 字段失焦或提交过之后才展示它的错误，避免用户还没输入就看到红字。
  const [touched, setTouched] = useState<Set<ProductTextField>>(new Set());
  const [submittedSku, setSubmittedSku] = useState<string | null>(null);

  const visibleErrors: ProductFormErrors = {};
  for (const key of textFields) {
    const message = touched.has(key) ? validateProductField(key, values[key]) : undefined;
    if (message) visibleErrors[key] = message;
  }
  // 服务端报 SKU 重复后，改动 SKU 就不再认为重复。
  const duplicated =
    error instanceof ApiError &&
    error.code === "SKU_DUPLICATED" &&
    values.sku.trim() === submittedSku;
  if (duplicated && !visibleErrors.sku) visibleErrors.sku = "该 SKU 已存在";
  const alertMessage =
    error instanceof ApiError && error.code === "VALIDATION_ERROR" ? error.message : null;

  const touch = (key: ProductTextField) =>
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(new Set(textFields));
    const parsed = parseProductForm(values);
    if (!parsed.ok) return;
    setSubmittedSku(parsed.data.sku);
    onSubmit(parsed.data);
  };

  const textField = (
    key: ProductTextField,
    label: string,
    inputProps: {
      placeholder?: string;
      inputMode?: "decimal" | "numeric";
      autoFocus?: boolean;
    } = {},
  ) => (
    <TextField
      className={styles.field}
      name={key}
      value={values[key]}
      onChange={(value) =>
        setValues((prev) => ({ ...prev, [key]: sanitizeProductField(key, value) }))
      }
      onBlur={() => touch(key)}
      inputMode={inputProps.inputMode}
      // 关闭浏览器的输入历史下拉。
      autoComplete="off"
      isInvalid={Boolean(visibleErrors[key])}
    >
      <Label>{label}</Label>
      <Input placeholder={inputProps.placeholder} autoFocus={inputProps.autoFocus} />
      <Text slot="errorMessage" className={styles.error}>
        {visibleErrors[key]}
      </Text>
    </TextField>
  );

  return (
    // 校验由我们自己控制：用 aria 模式，避免浏览器原生校验拦住提交。
    <Form className={styles.form} validationBehavior="aria" onSubmit={handleSubmit}>
      {alertMessage ? (
        <Alert kind="error" title="提交失败" description={alertMessage} />
      ) : null}
      {textField("sku", "SKU", { placeholder: "例如 SKU-E0013", autoFocus: true })}
      {textField("name", "商品名称")}
      <div className={styles.row}>
        {textField("price", "价格（元）", { placeholder: "0.00", inputMode: "decimal" })}
        {textField("stock", "库存", { placeholder: "0", inputMode: "numeric" })}
      </div>
      <RadioGroup
        className={styles.field}
        orientation="horizontal"
        value={values.status}
        onChange={(value) =>
          setValues((prev) => ({ ...prev, status: value as ProductStatus }))
        }
      >
        <Label>商品状态</Label>
        <div className={styles.radios}>
          <RadioField value="on">
            <RadioButton className={styles.radio}>在售</RadioButton>
          </RadioField>
          <RadioField value="off">
            <RadioButton className={styles.radio}>已下架</RadioButton>
          </RadioField>
        </div>
      </RadioGroup>
      <div className={styles.actions}>
        <Button variant="secondary" isDisabled={isPending} onPress={onCancel}>
          取消
        </Button>
        <Button variant="primary" type="submit" isDisabled={isPending}>
          {isPending ? "创建中…" : "创建"}
        </Button>
      </div>
    </Form>
  );
}
