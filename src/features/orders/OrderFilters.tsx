import { useState } from "react";
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  TextField,
  Input,
  Label,
} from "react-aria-components";
import { useSearchParams } from "react-router";
import { parseOrderFilters } from "./types";
import styles from "./Orders.module.css";

export function OrderFilters() {
  const [params, setParams] = useSearchParams();
  const filters = parseOrderFilters(params);
  const [q, setQ] = useState(filters.q);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  };
  return (
    <div className={styles.filters}>
      <TextField
        aria-label="搜索订单"
        className={styles.search}
        value={q}
        onChange={setQ}
      >
        <Label>订单号</Label>
        <Input
          placeholder="输入订单号"
          onKeyDown={(event) => {
            if (event.key === "Enter") update("q", q);
          }}
        />
      </TextField>
      <Select
        aria-label="订单状态"
        selectedKey={filters.status}
        onSelectionChange={(key) => update("status", String(key))}
      >
        <Label>订单状态</Label>
        <Button className={styles.select}>
          <SelectValue />
        </Button>
        <Popover>
          <ListBox>
            <ListBoxItem id="all">全部状态</ListBoxItem>
            <ListBoxItem id="pending">待处理</ListBoxItem>
            <ListBoxItem id="confirmed">已确认</ListBoxItem>
            <ListBoxItem id="cancelled">已取消</ListBoxItem>
          </ListBox>
        </Popover>
      </Select>
      <Button className={styles.action} onPress={() => update("q", q)}>
        查询
      </Button>
      <Button
        className={styles.action}
        onPress={() => {
          setQ("");
          setParams({});
        }}
      >
        重置
      </Button>
    </div>
  );
}
