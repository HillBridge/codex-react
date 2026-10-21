import { Label, RadioButton, RadioField, RadioGroup } from "react-aria-components";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import styles from "./FormField.module.css";

interface FormRadioGroupProps<T extends FieldValues, TOut> {
  control: Control<T, unknown, TOut>;
  name: FieldPath<T>;
  label: string;
  options: { value: string; label: string }[];
}

export function FormRadioGroup<T extends FieldValues, TOut = T>({
  control,
  name,
  label,
  options,
}: FormRadioGroupProps<T, TOut>) {
  const { field } = useController({ control, name });

  return (
    <RadioGroup
      className={styles.field}
      orientation="horizontal"
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      isDisabled={field.disabled}
    >
      <Label>{label}</Label>
      <div className={styles.radios}>
        {options.map((option) => (
          <RadioField key={option.value} value={option.value}>
            <RadioButton className={styles.radio}>{option.label}</RadioButton>
          </RadioField>
        ))}
      </div>
    </RadioGroup>
  );
}
