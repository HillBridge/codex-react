import { useState, type ReactNode } from "react";
import {
  Button as AriaButton,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  TextField,
} from "react-aria-components";
import { Button } from "@/shared/ui/button";
import styles from "./TableFilter.module.css";

export type TableFilterField =
  | {
      type: "search";
      key: string;
      label: string;
      placeholder?: string;
      ariaLabel?: string;
    }
  | {
      type: "select";
      key: string;
      label: string;
      options: { id: string; label: string }[];
      ariaLabel?: string;
    };

interface TableFilterProps {
  fields: TableFilterField[];
  values: Record<string, string>;
  // 下拉项选中立即触发；搜索框在回车或点击“查询”时触发。
  onChange: (patch: Record<string, string>) => void;
  onReset: () => void;
  // 追加在“查询”“重置”之后的自定义操作（如导出），建议使用 shared/ui 的 Button。
  actions?: ReactNode;
}

export function TableFilter({
  fields,
  values,
  onChange,
  onReset,
  actions,
}: TableFilterProps) {
  const searchFields = fields.filter((field) => field.type === "search");
  const initialDrafts = () =>
    Object.fromEntries(searchFields.map((field) => [field.key, values[field.key] ?? ""]));
  const [drafts, setDrafts] = useState(initialDrafts);
  const submit = () => onChange(drafts);

  return (
    <div className={styles.filters}>
      {fields.map((field) =>
        field.type === "search" ? (
          <TextField
            key={field.key}
            aria-label={field.ariaLabel ?? field.label}
            className={styles.search}
            value={drafts[field.key] ?? ""}
            onChange={(value) => setDrafts((prev) => ({ ...prev, [field.key]: value }))}
          >
            <Label>{field.label}</Label>
            <Input
              placeholder={field.placeholder}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
          </TextField>
        ) : (
          <Select
            key={field.key}
            aria-label={field.ariaLabel ?? field.label}
            className={styles.selectField}
            selectedKey={values[field.key]}
            onSelectionChange={(key) => onChange({ [field.key]: String(key) })}
          >
            <Label>{field.label}</Label>
            <AriaButton className={styles.select}>
              <SelectValue />
            </AriaButton>
            <Popover className={styles.popover}>
              <ListBox className={styles.list}>
                {field.options.map((option) => (
                  <ListBoxItem key={option.id} className={styles.option} id={option.id}>
                    {option.label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Popover>
          </Select>
        ),
      )}
      <div className={styles.actions}>
        <Button onPress={submit}>查询</Button>
        <Button
          onPress={() => {
            setDrafts(Object.fromEntries(searchFields.map((field) => [field.key, ""])));
            onReset();
          }}
        >
          重置
        </Button>
        {actions}
      </div>
    </div>
  );
}
