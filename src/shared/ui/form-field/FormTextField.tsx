import { Input, Label, Text, TextField } from "react-aria-components";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import styles from "./FormField.module.css";

interface FormTextFieldProps<T extends FieldValues, TOut> {
  control: Control<T, unknown, TOut>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  type?: "text" | "password";
  // 默认关闭浏览器的输入历史；登录等需要密码管理器的字段显式传 username / current-password。
  autoComplete?: string;
  autoFocus?: boolean;
  // 输入时过滤掉不可能合法的字符。
  sanitize?: (value: string) => string;
  // 返回 true 时本次失焦不触发校验，配合 useAbandonGuard 使用。
  shouldSkipBlur?: () => boolean;
}

// 表单文本框的标准写法：react-hook-form 管状态，zod 管规则，这里只负责展示。
export function FormTextField<T extends FieldValues, TOut = T>({
  control,
  name,
  label,
  placeholder,
  inputMode,
  type,
  autoComplete = "off",
  autoFocus,
  sanitize,
  shouldSkipBlur,
}: FormTextFieldProps<T, TOut>) {
  const { field, fieldState } = useController({ control, name });
  const { name: fieldName, value, onChange, onBlur, disabled, ref } = field;
  const message = fieldState.error?.message;

  return (
    <TextField
      className={styles.field}
      name={fieldName}
      value={value ?? ""}
      onChange={(next) => onChange(sanitize ? sanitize(next) : next)}
      onBlur={() => {
        if (!shouldSkipBlur?.()) onBlur();
      }}
      inputMode={inputMode}
      isInvalid={Boolean(message)}
      isDisabled={disabled}
      type={type}
      autoComplete={autoComplete}
    >
      <Label>{label}</Label>
      <Input ref={ref} placeholder={placeholder} autoFocus={autoFocus} />
      <Text slot="errorMessage" className={styles.error}>
        {message}
      </Text>
    </TextField>
  );
}
