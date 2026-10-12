import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { useNavigate } from "react-router";
import type { Merchant } from "./types";
import styles from "./MerchantSwitcher.module.css";

interface MerchantSwitcherProps {
  merchant: Merchant;
  merchants: Merchant[];
}

export function MerchantSwitcher({ merchant, merchants }: MerchantSwitcherProps) {
  const navigate = useNavigate();

  return (
    <Select
      aria-label="切换商户"
      className={styles.select}
      onSelectionChange={(key) => navigate(`/m/${String(key)}`, { replace: true })}
      selectedKey={merchant.id}
    >
      <AriaButton className={styles.trigger}>
        <SelectValue />
        <span aria-hidden="true">⌄</span>
      </AriaButton>
      <Popover className={styles.popover}>
        <ListBox className={styles.list}>
          {merchants.map((item) => (
            <ListBoxItem className={styles.option} id={item.id} key={item.id}>
              {item.name}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
