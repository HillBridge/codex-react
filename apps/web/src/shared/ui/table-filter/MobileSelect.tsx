import { useState } from "react";
import {
  Button as AriaButton,
  Dialog,
  ListBox,
  ListBoxItem,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { useSwipeDismiss } from "@/shared/hooks/useSwipeDismiss";
import styles from "./TableFilter.module.css";

interface MobileSelectProps {
  label: string;
  ariaLabel?: string;
  options: { id: string; label: string }[];
  value: string | undefined;
  onChange: (key: string) => void;
  className?: string;
}

// 手机上的下拉：点击后选项从底部滑出。RAC 的 Popover 定位由库直接写入元素样式，无法改成贴底，所以这里单独做。
export function MobileSelect({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: MobileSelectProps) {
  const [isOpen, setOpen] = useState(false);
  const swipeRef = useSwipeDismiss("down", () => setOpen(false));
  const selectedLabel = options.find((option) => option.id === value)?.label ?? "";

  return (
    <div className={className}>
      <span className={styles.mobileLabel}>{label}</span>
      <AriaButton
        aria-label={`${ariaLabel ?? label} ${selectedLabel}`}
        aria-haspopup="listbox"
        className={styles.select}
        onPress={() => setOpen(true)}
      >
        {selectedLabel}
      </AriaButton>
      <ModalOverlay
        className={styles.sheetOverlay}
        isDismissable
        isOpen={isOpen}
        onOpenChange={setOpen}
      >
        <Modal className={styles.sheet} ref={swipeRef}>
          <Dialog aria-label={ariaLabel ?? label} className={styles.sheetDialog}>
            <ListBox
              aria-label={ariaLabel ?? label}
              className={styles.list}
              onSelectionChange={(keys) => {
                const [key] = [...keys];
                if (key !== undefined) onChange(String(key));
                setOpen(false);
              }}
              selectedKeys={value ? [value] : []}
              selectionMode="single"
            >
              {options.map((option) => (
                <ListBoxItem key={option.id} className={styles.option} id={option.id}>
                  {option.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
}
