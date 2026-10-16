import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import styles from "./Dialog.module.css";

interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  // 默认 32rem；内容较宽（如表格）时用 wide。
  size?: "default" | "wide";
  role?: "dialog" | "alertdialog";
  isDismissable?: boolean;
  children: ReactNode;
}

export function Dialog({
  isOpen,
  title,
  onClose,
  size = "default",
  role = "dialog",
  isDismissable = true,
  children,
}: DialogProps) {
  return (
    <ModalOverlay
      className={styles.overlay}
      isOpen={isOpen}
      isDismissable={isDismissable}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal
        className={[styles.modal, size === "wide" && styles.wide]
          .filter(Boolean)
          .join(" ")}
      >
        <AriaDialog role={role} className={styles.dialog}>
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
