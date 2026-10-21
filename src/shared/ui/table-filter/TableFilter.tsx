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
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { Button } from "@/shared/ui/button";
import { MobileSelect } from "./MobileSelect";
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
  const isMobile = useIsMobile();
  // 窄屏：有搜索框时，下拉筛选默认折叠，由“筛选”按钮展开；没有搜索框则不折叠。
  const [expanded, setExpanded] = useState(false);
  const selectFields = fields.filter((field) => field.type === "select");
  const collapsible = searchFields.length > 0 && selectFields.length > 0;
  const collapsed = collapsible && !expanded;
  const activeCount = selectFields.filter(
    (field) => values[field.key] && values[field.key] !== "all",
  ).length;

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
        ) : isMobile ? (
          <MobileSelect
            key={field.key}
            label={field.label}
            ariaLabel={field.ariaLabel}
            options={field.options}
            value={values[field.key]}
            onChange={(key) => onChange({ [field.key]: key })}
            className={[styles.selectField, collapsed && styles.collapsed]
              .filter(Boolean)
              .join(" ")}
          />
        ) : (
          <Select
            key={field.key}
            aria-label={field.ariaLabel ?? field.label}
            className={[styles.selectField, collapsed && styles.collapsed]
              .filter(Boolean)
              .join(" ")}
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
        {collapsible ? (
          <Button
            aria-expanded={expanded}
            className={styles.toggle}
            onPress={() => setExpanded((prev) => !prev)}
          >
            {activeCount > 0 ? `筛选 (${activeCount})` : "筛选"}
          </Button>
        ) : null}
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
